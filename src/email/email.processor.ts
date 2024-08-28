import { Inject } from '@nestjs/common';
import { SecretsVaultKeys } from '../utils/secrets';
import { User } from '../user/user.entity';
import { VerificationMessagesService } from './verification-messages.service';
import { ConfigService } from '@nestjs/config';
import { Process, Processor } from '@nestjs/bull';
import { Job } from 'bull';
import { PinoLogger } from 'nestjs-pino';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Enrollment,
  ProjectRole,
  RequestState,
} from '../enrollment/enrollment.entity';
import { In, Repository } from 'typeorm';

export interface EmailMessage {
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  subject: string;
  text: string;
  html: string;
}

export const EMAIL_SENDERS = 'EMAIL_SENDERS';
export interface IEmailSender {
  sendMail(emailMessage: EmailMessage): Promise<void>;
}

export interface IEmailService {
  sendVerificationEmail(user: User): Promise<void>;
}

@Processor('emails')
export class EmailProcessor {
  private selectedSender = 0;

  constructor(
    @Inject(EMAIL_SENDERS)
    private readonly emailSenders: Array<IEmailSender>,
    private readonly verificationEmailToken: VerificationMessagesService,
    @InjectRepository(Enrollment)
    private readonly enrollmentRepository: Repository<Enrollment>,
    private readonly logger: PinoLogger,
    private readonly config: ConfigService,
  ) {
    if (emailSenders.length === 0)
      throw new Error('No email senders configured');
  }

  @Process('email-verification')
  async sendVerificationEmail(job: Job<User>) {
    const user = job.data;
    const verificationLink =
      await this.verificationEmailToken.generateVerifyEmailUrl(user);

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: 'Universiteams',
      },
      to: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
      subject: 'Por favor confirma tu correo electrónico',
      text:
        `Hola ${user.firstName},` +
        'Bienvenido a Universiteams. Estamos emocionados de tenerte a bordo y solo hay un paso para verificar si realmente es tu dirección de correo electrónico:' +
        `link="${verificationLink}" Confirmar Cuenta`,
      html:
        `<h1>Hola ${user.firstName},</h1>` +
        '<p>Bienvenido a Universiteams. Estamos emocionados de tenerte a bordo y solo hay un paso para verificar si realmente es tu dirección de correo electrónico:</p>' +
        '<p style="text-align:center">' +
        `<a href="${verificationLink}" style="background-color:#32c766;color:white;padding:15px 32px;text-decoration:none;padding:15px 32px;display:inline-block;font-size:16px;border-radius:7px">Confirmar Cuenta</a>` +
        '</p>',
    };

    await this.emailSenders[this.selectedSender]
      .sendMail(message)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
        throw err;
      });

    this.logger.debug(
      `Verification email to ${user.email} successfully registered to be sent`,
    );
    return {};
  }

  @Process('forgot-password')
  async sendForgetPasswordEmail(job: Job<User>) {
    const user = job.data;
    const verificationLink =
      await this.verificationEmailToken.generateForgetPasswordUrl(user);

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: 'Universiteams',
      },
      to: [{ email: user.email, name: `${user.firstName} ${user.lastName}` }],
      subject: '¿Olvidaste tu contraseña? Podemos ayudarte.',
      text:
        `Hola ${user.firstName},` +
        '¿Olvidaste tu contraseña? No te preocupes, nosotros te ayudamos. Haz clic en el enlace de abajo para restablecer tu contraseña.' +
        `link="${verificationLink}" Establecer nueva contraseña`,
      html:
        `<h1>Hola ${user.firstName},</h1>` +
        '<p>¿Olvidaste tu contraseña? No te preocupes, nosotros te ayudamos. Haz clic en el enlace de abajo para restablecer tu contraseña.</p>' +
        '<p style="text-align:center">' +
        `<a href="${verificationLink}" style="background-color:#32c766;color:white;padding:15px 32px;text-decoration:none;padding:15px 32px;display:inline-block;font-size:16px;border-radius:7px">Establecer nueva contraseña</a>` +
        '</p>',
    };

    await this.emailSenders[this.selectedSender]
      .sendMail(message)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
        throw err;
      });

    this.logger.debug(
      `Forgot password email to ${user.email} successfully registered to be sent`,
    );
    return {};
  }

  @Process('enrollment-request-notify')
  async sendEnrollmentRequestNotifyEmail(job: Job<Enrollment>) {
    const enrollment = job.data;

    const enrolledAdmins = await this.enrollmentRepository.find({
      where: {
        project: enrollment.project,
        role: In([ProjectRole.Admin, ProjectRole.Leader]),
        requestState: RequestState.Accepted,
      },
      relations: ['user'],
      select: ['user'],
    });

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: 'Universiteams',
      },
      to: enrolledAdmins.map((admin) => ({
        email: admin.user.email,
        name: `${admin.user.firstName} ${admin.user.lastName}`,
      })),
      subject: 'Nueva Solicitud de Inscripción Recibida',
      text:
        `Hola,\n\n` +
        `Se ha recibido una nueva solicitud de inscripción de ${enrollment.user.firstName} ${enrollment.user.lastName} (${enrollment.user.email}).\n` +
        'Por favor revise la solicitud y tome las acciones necesarias.',
      html:
        `<h1>Hola,</h1>` +
        `<p>Se ha recibido una nueva solicitud de inscripción de ${enrollment.user.firstName} ${enrollment.user.lastName} (${enrollment.user.email}).</p>` +
        '<p>Por favor revise la solicitud y tome las acciones necesarias.</p>',
    };

    await this.emailSenders[this.selectedSender]
      .sendMail(message)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
        throw err;
      });

    this.logger.debug(
      `Enrollment request notify email to project leader and admins successfully registered to be sent`,
    );

    return {};
  }
}
