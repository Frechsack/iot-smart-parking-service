import { HttpException, Injectable } from '@nestjs/common';
import { PaginationDto } from 'src/core/dto/pagination-dto';
import { LoggerService } from 'src/core/service/logger.service';
import { Account } from 'src/orm/entity/account';
import { LicensePlate } from 'src/orm/entity/license-plate';
import { LicensePlatePhotoTypeName } from 'src/orm/entity/license-plate-photo-type';
import { AccountRepository } from 'src/orm/repository/account.repository';
import { LicensePlatePhotoRepository } from 'src/orm/repository/license-plate-photo.repository';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { PaymentRepository } from 'src/orm/repository/payment.repository';
import { EntityManager } from 'typeorm';
import { AccountDto } from '../dto/account-dto';
import { PaymentDto } from '../dto/payment-dto';
import { JwtService } from './jwt.service';

@Injectable()
export class AccountService {

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly licensePlateRepository: LicensePlateRepository,
    private readonly loggerService: LoggerService,
    private readonly paymentRepository: PaymentRepository,
    private readonly jwtService: JwtService,
    private readonly licensePlatePhotoRepository: LicensePlatePhotoRepository

  ) {
      this.loggerService.context = AccountService.name;
    }

    public async editAccount(email: string, firstname?: string, lastname?: string, zip?: string, street?: string, streetNr?: string, password?: string): Promise<void> {
        let account = await this.accountRepository.findOneByEmail(email);
        if (account == null)
            return Promise.reject(new HttpException('No Account with matching email in use', 403));
        if (firstname != undefined) {
            account.firstname = firstname;
        }

        if (lastname != undefined) {
            account.lastname = lastname;
        }

        if (zip != undefined) {
            account.zip = zip;
        }

        if (street != undefined) {
            account.street = street;
        }

        if (streetNr != undefined) {
            account.streetNr = streetNr;
        }

        if (password != undefined) {
            account.secret = password;
        }

        try {
            await this.accountRepository.save(account);
            this.loggerService.log(`Account modified, email: "${email}"`);
        }
        catch (error) {
            this.loggerService.error(`Modification of account failed, email: "${email}"`);
            return Promise.reject(error);
        }
    }

    /**
    * Erstellt ein Autentifizierungstoken für einen Account.
    * @param email Die Email des Accounts.
    * @param password Das Password des Accounts.
    * @returns Gibt ein JWT-Token zurück.
    */
    public async authenticate(email: string, password: string): Promise<string> {
        let account = await this.accountRepository.findOneByEmail(email);
        if (account == null) {
            return Promise.reject(new HttpException ("There is no Account for corrensponding mail adress", 404));
        }

        if (account.secret == password) {
            return (await this.jwtService.generate(email)).jwt;

        }

        return Promise.reject(new HttpException("Try a better password next time looser", 401));
    }

  public async insertAccount(email: string, firstname: string, lastname: string, zip: string, street: string, streetNr: string, password: string): Promise<void> {
    if(email === 'this')
        return Promise.reject(new HttpException('Invalid email', 403));

    let account = await this.accountRepository.findOneByEmail(email);
    if(account != null)
      return Promise.reject(new HttpException('Account already in use', 403));
    account = new Account();
    account.email = email;
    account.firstname = firstname;
    account.lastname = lastname;
    account.zip = zip;
    account.street = street;
    account.streetNr = streetNr;
    account.secret = password;
    try {
      await this.accountRepository.save(account);
      this.loggerService.log(`Created account, email: "${email}"`);
    }
    catch(error) {
      this.loggerService.error(`Creation of account failed, email: "${email}"`);
      return Promise.reject(error);
    }
  }

  public async getPayments(email: string, plate: string, page: number = 0, pageSize: number = 20): Promise<PaginationDto<PaymentDto>> {
    const payments = await this.paymentRepository.findAndCount({
      skip: page * pageSize,
      take: pageSize,
      where: { licensePlate: { plate: plate }, account: { email: email}},
      order: { from: 'DESC' }
    });
    return new PaginationDto(payments[1],payments[0].map(it => new PaymentDto(it.from, it.to, it.price)));
  }

  public async removeLicensePlate(email: string, plate: string): Promise<void> {
    const account = await this.accountRepository.findOneByEmail(email);
    if(account == null)
      return Promise.reject(new HttpException('Account not found',404));

    let licensePlate = await this.licensePlateRepository.findOneByPlate(plate);
    if(licensePlate == null)
      return;

    if((await licensePlate.account).email != email)
      return Promise.reject(new HttpException('License-plate registered for different used', 401));

    // Prüfen ob Auto in Parkhaus
    const latestPhoto = await this.licensePlatePhotoRepository.findLatestByPlate(licensePlate.plate);
    if(latestPhoto != null)
      if((await latestPhoto.type).name === LicensePlatePhotoTypeName.ENTER)
        return Promise.reject(new HttpException('Plate is currently within the parkhouse.',404));

    const transaction = async (manager: EntityManager) => {
      const licensePlateRepository = this.licensePlateRepository.forTransaction(manager);
      const licensePlatePhotoRepository = this.licensePlatePhotoRepository.forTransaction(manager);
      await licensePlatePhotoRepository.remove(await licensePlatePhotoRepository.findBy({ licensePlate: { plate: plate }}));
      await licensePlateRepository.delete(plate);
    }

    try {
      await this.licensePlateRepository.runTransaction(transaction);
      this.loggerService.log(`Removed license-plate, email: "${email}", plate: "${plate}"`);
    }
    catch (error) {
      this.loggerService.error(`Failed remove of license-plate, email: "${email}", plate: "${plate}", error: "${error}"`);
      return Promise.reject(new HttpException('License-plate could not be removed', 403));
    }
  }

  public async addLicensePlate(email: string, plate: string): Promise<void> {
    const account = await this.accountRepository.findOneByEmail(email);
    if(account == null)
      return Promise.reject(new HttpException('Account not found',404));

    let licensePlate = await this.licensePlateRepository.findOneByPlate(plate);
    if(licensePlate != null){
      if((await licensePlate.account).email == email)
        return;
      else
        throw new HttpException('License-plate already registered for other used', 403);
    }

    licensePlate = new LicensePlate();
    licensePlate.plate = plate;
    licensePlate.account = Promise.resolve(account);
    try {
      await this.licensePlateRepository.save(licensePlate);
      this.loggerService.log(`Registered license-plate, email: "${email}", plate: "${plate}"`);
    }
    catch( error) {
      this.loggerService.error(`Failed register of license-plate, email: "${email}", plate: "${plate}", error: "${error}"`);
      return Promise.reject(error);
    }
  }

  public async getAccount(email: string): Promise<AccountDto>{
    const account = await this.accountRepository.findOneByEmail(email);
    if(account == null)
      return Promise.reject(new HttpException('Account not found',404));

    return new AccountDto(
      account.email,
      (await account.licensPlates).map(it => it.plate),
      account.isAdmin
    );
  }
}
