import { Injectable } from '@nestjs/common';
import { AccountRepository } from 'src/orm/repository/account.repository';

@Injectable()
export class AccountService {


  constructor(private readonly accountRepository: AccountRepository) {

    accountRepository.clear();
  }

}
