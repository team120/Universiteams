import { Test } from '@nestjs/testing';
import { NodemailerEmailSender } from '../../src/email/nodemailer.email-sender';
import { SendGridEmailSender } from '../../src/email/sendgrid.email-sender';
import { SendInBlueEmailSender } from '../../src/email/sendinblue.email-sender';
import { ProjectModule } from '../../src/project/project.module';
import { CURRENT_DATE_SERVICE } from '../../src/utils/current-date';
import { TokenExpirationTimes } from '../../src/utils/token-expiration/token-expiration-times';
import { commonImportsArray } from '../utils/common-imports.e2e';
import { CurrentDateE2EMock } from '../utils/current-date.e2e-mock';
import { TokenExpirationTimesFake } from '../utils/token-expiration-times.fake';

export const createProjectTestingApp = async () => {
  const tokenExpirationTimesTesting = new TokenExpirationTimesFake({
    accessToken: {
      value: 15,
      dimension: 'minutes',
    },
    refreshToken: { value: 7, dimension: 'days' },
  });

  const moduleFixture = await Test.createTestingModule({
    imports: [...commonImportsArray, ProjectModule],
  })
    .overrideProvider(SendGridEmailSender)
    .useValue({})
    .overrideProvider(SendInBlueEmailSender)
    .useValue({})
    .overrideProvider(NodemailerEmailSender)
    .useValue({})
    .overrideProvider(CURRENT_DATE_SERVICE)
    .useValue(new CurrentDateE2EMock())
    .overrideProvider(TokenExpirationTimes)
    .useValue(tokenExpirationTimesTesting)
    .compile();

  return {
    app: moduleFixture.createNestApplication(),
    tokenExpirationTimesTesting: tokenExpirationTimesTesting,
  };
};
