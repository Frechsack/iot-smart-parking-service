import { HttpException, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/core/service/logger.service';
import { Account } from 'src/orm/entity/account';
import { LicensePlate } from 'src/orm/entity/license-plate';
import { AccountRepository } from 'src/orm/repository/account.repository';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { PaymentRepository } from 'src/orm/repository/payment.repository';
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
    private readonly jwtService: JwtService

  ) {
      this.loggerService.context = AccountService.name;
    }

    public async editAccount(email: string, firstname?: string, lastname?: string, zip?: string, street?: string, streetNr?: string, password?: string): Promise<void> {
        let account = await this.accountRepository.findOneByEmail(email);
        if (account == null)
            throw new HttpException('No Account with matching email in use', 403);
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
            throw error;
        }
    }

    public async authenticate(email: string, password: string): Promise<string> {
        let account = await this.accountRepository.findOneByEmail(email);
        if (account == null) {
            throw new HttpException ("There is no Account for corrensponding mail adress", 404)

        }

        if (account.secret == password) {
            return (await this.jwtService.generate(email)).jwt;
        
        }

        throw new HttpException("Try a better password next time looser", 42069);

        
    }

  public async insertAccount(email: string, firstname: string, lastname: string, zip: string, street: string, streetNr: string, password: string): Promise<void> {
    let account = await this.accountRepository.findOneByEmail(email);
    if(account != null)
      throw new HttpException('Account already in use', 403);
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
      throw error;
    }
  }

  public async getPayments(email: string, plate: string, page: number = 0, pageSize: number = 20): Promise<PaymentDto[]> {
    const payments = await this.paymentRepository.find({
      skip: page * pageSize,
      take: pageSize,
      where: { licensePlate: { plate: plate }, account: { email: email}},
      order: { from: 'DESC' }
    });
    return payments.map(it => new PaymentDto(it.from, it.to, it.price));
  }

  public async removeLicensePlate(email: string, plate: string): Promise<void> {
    const account = await this.accountRepository.findOneByEmail(email);
    if(account == null)
      throw new HttpException('Account not found',404);

    let licensePlate = await this.licensePlateRepository.findOneByPlate(plate);
    if(licensePlate == null)
      return;

    if((await licensePlate.account).email == email)
    {
      try {
        await this.licensePlateRepository.softRemove(licensePlate);
        this.loggerService.log(`Removed license-plate, email: "${email}", plate: "${plate}"`);
      }
      catch( error) {
        this.loggerService.error(`Failed remove of license-plate, email: "${email}", plate: "${plate}", error: "${error}"`);
      }
    }
    else{
      throw new HttpException('License-plate registered for different used', 401);
    }
  }

  public async addLicensePlate(email: string, plate: string): Promise<void> {
    const account = await this.accountRepository.findOneByEmail(email);
    if(account == null)
      throw new HttpException('Account not found',404);

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
    }
  }

  public async getAccount(email: string): Promise<AccountDto>{
    const account = await this.accountRepository.findOneByEmail(email);
    if(account == null)
      throw new HttpException('Account not found',404);

    return new AccountDto(
      account.email,
      (await account.licensPlates).map(it => it.plate)
    );
  }
}
