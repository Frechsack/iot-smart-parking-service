import { Controller, Get, Param, Query, UseInterceptors, Headers, HttpException, Post, Put } from '@nestjs/common';
import { PaymentDto } from '../dto/payment-dto';
import { AuthenticationInterceptor, AUTHENTICATION_HEADER_TOKEN } from '../interceptor/authentication.interceptor';
import { AccountService } from '../service/account.service';
import { JwtService } from '../service/jwt.service';

@Controller('accounts')
export class AccountController {

  constructor(
    private readonly accountService: AccountService,
    private readonly jwtService: JwtService
  ){
  }

  @Post(':email/authenticate')
  public async authenticate(
    @Param('email') email: string,
    @Query('passowrd') password: string
  ): Promise<string> {

  }

  @Put(':email/update')
  public async updateAccount(
    @Param('email') email: string,
    @Query('password') password: string,
    @Query('firstname') firstname: string,
    @Query('lastname') lastname: string,
    @Query('zip') zip: string,
    @Query('street') street: string,
    @Query('streetNr') streetNr: string,
  ): Promise<void> {
    
  }

  @Post('register')
  public async register(
      @Query('email') email: string,
      @Query('password') password: string,
      @Query('firstname') firstname: string,
      @Query('lastname') lastname: string,
      @Query('zip') zip: string,
      @Query('street') street: string,
      @Query('streetNr') streetNr: string,
  ): Promise<void> {
    this.accountService.insertAccount(email,firstname,lastname,zip,street,streetNr,password);
  }


  @UseInterceptors(AuthenticationInterceptor)
  @Get(':email/plates/:plate/payments')
  public async getPayments(
    @Headers(AUTHENTICATION_HEADER_TOKEN) authHeader: string,
    @Param('email') email: string,
    @Param('plate') plate: string,
    @Query('page') page: number = 0,
    @Query('pageSize') pageSize: number = 20
  ): Promise<PaymentDto[]> {
    if(!(await this.jwtService.verify(authHeader)))
      return Promise.reject(new HttpException('Permission denied',403));

    return this.accountService.getPayments(email, plate, page, pageSize);
  }
}
