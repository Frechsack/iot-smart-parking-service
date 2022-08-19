import { Controller, Get, Param, Query, UseInterceptors, Headers, HttpException, Post, Put, Delete } from '@nestjs/common';
import { PaginationDto } from 'src/core/dto/pagination-dto';
import { AccountDto } from '../dto/account-dto';
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
    @Query('password') password: string
  ): Promise<string> {
      return this.accountService.authenticate(email, password);
  }

  @Put(':email')
  public async update(
    @Headers(AUTHENTICATION_HEADER_TOKEN) authHeader: string,
    @Param('email') email: string,
    @Query('password') password?: string,
    @Query('firstname') firstname?: string,
    @Query('lastname') lastname?: string,
    @Query('zip') zip?: string,
    @Query('street') street?: string,
    @Query('streetNr') streetNr?: string,
  ): Promise<void> {
    const account = await this.jwtService.authenticated(authHeader);
    if(account == null)
      return Promise.reject(new HttpException('Invalid authentication',401));
    if(email === 'this')
      email = account.email;
    if(email !== account.email && !account.isAdmin)
      return Promise.reject(new HttpException('Invalid authentication',401));
    return  this.accountService.editAccount(email, firstname, lastname, zip, street, streetNr, password);
  }

  @Post()
  public async register(
      @Query('email') email: string,
      @Query('password') password: string,
      @Query('firstname') firstname: string,
      @Query('lastname') lastname: string,
      @Query('zip') zip: string,
      @Query('street') street: string,
      @Query('streetNr') streetNr: string,
  ): Promise<void> {
    return this.accountService.insertAccount(email,firstname,lastname,zip,street,streetNr,password);
    }

    @Post(':email/plates')
    public async addPlate(
      @Headers(AUTHENTICATION_HEADER_TOKEN) authHeader: string,
        @Param('email') email: string,
        @Query('plate') plate: string,
    ): Promise<void> {
      const account = await this.jwtService.authenticated(authHeader);
      if(account == null)
        return Promise.reject(new HttpException('Invalid authentication',401));
      if(email === 'this')
        email = account.email;
      if(email !== account.email && !account.isAdmin)
        return Promise.reject(new HttpException('Invalid authentication',401));
      return this.accountService.addLicensePlate(email, plate);
    }

    @Delete(':email/plates/:plate')
    public async deletePlate(
      @Headers(AUTHENTICATION_HEADER_TOKEN) authHeader: string,
        @Param('email') email: string,
        @Param('plate') plate: string,
    ): Promise<void> {
      const account = await this.jwtService.authenticated(authHeader);
      if(account == null)
        return Promise.reject(new HttpException('Invalid authentication',401));
      if(email === 'this')
        email = account.email;
      if(email !== account.email && !account.isAdmin)
        return Promise.reject(new HttpException('Invalid authentication',401));
      return this.accountService.removeLicensePlate(email, plate);
    }

    @Get(':email')
    public async get(
        @Headers(AUTHENTICATION_HEADER_TOKEN) authHeader: string,
        @Param('email') email: string
    ): Promise<AccountDto>{
      const account = await this.jwtService.authenticated(authHeader);
      if(account == null)
        return Promise.reject(new HttpException('Invalid authentication',401));
      if(email === 'this')
        email = account.email;
      if(email !== account.email && !account.isAdmin)
        return Promise.reject(new HttpException('Invalid authentication',401));
      return this.accountService.getAccount(email);
    }


  @UseInterceptors(AuthenticationInterceptor)
  @Get(':email/plates/:plate/payments')
  public async getPayments(
    @Headers(AUTHENTICATION_HEADER_TOKEN) authHeader: string,
    @Param('email') email: string,
    @Param('plate') plate: string,
    @Query('page') page: number = 0,
    @Query('pageSize') pageSize: number = 20
  ): Promise<PaginationDto<PaymentDto>> {
    const account = await this.jwtService.authenticated(authHeader);
    if(account == null)
      return Promise.reject(new HttpException('Invalid authentication',401));
    if(email === 'this')
      email = account.email;
    if(email !== account.email && !account.isAdmin)
      return Promise.reject(new HttpException('Invalid authentication',401));
    return this.accountService.getPayments(email, plate, page, pageSize);
  }
}
