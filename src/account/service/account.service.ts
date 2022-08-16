import { HttpException, Injectable } from '@nestjs/common';
import { LoggerService } from 'src/core/service/logger.service';
import { LicensePlate } from 'src/orm/entity/license-plate';
import { AccountRepository } from 'src/orm/repository/account.repository';
import { LicensePlateRepository } from 'src/orm/repository/license-plate.repository';
import { PaymentRepository } from 'src/orm/repository/payment.repository';
import { AccountDto } from '../dto/account-dto';
import { PaymentDto } from '../dto/payment-dto';

@Injectable()
export class AccountService {

  constructor(
    private readonly accountRepository: AccountRepository,
    private readonly licensePlateRepository: LicensePlateRepository,
    private readonly loggerService: LoggerService,
    private readonly paymentRepository: PaymentRepository
  ) {
    this.loggerService.context = AccountService.name;
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
