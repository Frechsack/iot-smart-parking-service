import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerService } from 'src/core/service/logger.service';
import { Account } from 'src/orm/entity/account';
import { AuthenticationToken } from 'src/orm/entity/authentication-token';
import { AccountRepository } from 'src/orm/repository/account.repository';
import { AuthenticationTokenRepository } from 'src/orm/repository/authentication-token.repository';
const jwt = require('jsonwebtoken');

@Injectable()
export class JwtService {

  private readonly jwtKey: string;
  private readonly jwtValiditySeconds = 60 * 60;

  constructor(
    configService: ConfigService,
    private readonly authenticationTokenRepository: AuthenticationTokenRepository,
    private readonly accountRepository: AccountRepository,
    private readonly loggerService: LoggerService
  ){
    this.loggerService.context = JwtService.name;
    this.jwtKey = configService.get('JWT_KEY','EMPTY_KEY');
  }

  private async generateJwt(): Promise<string> {
    return new Promise((resolve,reject) => {
      jwt.sign({},this.jwtKey, { expiresIn: this.jwtValiditySeconds * 2 }, (error: any, token: string) => {
        if(error) reject(error);
        else resolve(token);
      });
    });
  }

  private async verifyJwt(token: string ): Promise<boolean> {
    return new Promise((resolve) => {
      jwt.verify(token, this.jwtKey, (error: any) => {
        if(error) resolve(false);
        else resolve(true);
      });
    });
  }

  public async generate(email: string): Promise<AuthenticationToken>{
    const jwt = await this.generateJwt();
    const account = await this.accountRepository.findOneByEmail(email);
    if(account == null)
      throw new Error('Invalid email');

    let authenticationToken = new AuthenticationToken();
    authenticationToken.created = new Date();
    authenticationToken.expires = new Date(Date.now() + this.jwtValiditySeconds * 1000);
    authenticationToken.jwt = jwt;
    authenticationToken.owner = Promise.resolve(account);

    try {
      authenticationToken = await this.authenticationTokenRepository.save(authenticationToken);
      this.loggerService.log(`Generated Authentication-token, email: "${email}"`);
      return authenticationToken;
    }
    catch (error){
      throw error;
    }
  }

  public async verify(jwt: string): Promise<boolean> {
    const isValidJwt = await this.verifyJwt(jwt);
    if(!isValidJwt) return false;

    const authenticationToken = await this.authenticationTokenRepository.findOneByJwt(jwt);
    if(authenticationToken == null) return false;

    return authenticationToken.isValid;
  }

  public async authenticated(jwt: string): Promise<Account | null> {
    const isValidJwt = await this.verifyJwt(jwt);
    if(!isValidJwt) return null;

    const authenticationToken = await this.authenticationTokenRepository.findOneByJwt(jwt);
    if(authenticationToken == null) return null;

    return await authenticationToken.owner;
  }
}
