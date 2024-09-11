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
import {
  EnrollmentInvitationNotifyEmailData,
  EnrollmentRequestNotifyEmailData,
} from './dtos/enrollment-request-email-data.dto';

export interface EmailMessage {
  from: { name: string; email: string };
  to: { name: string; email: string }[];
  bcc?: { name: string; email: string }[];
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

export const emailQueueProcessor = 'emails';

export const enrollmentRequestEmailJob = 'enrollment-request-notify';
export const enrollmentInvitationEmailJob = 'enrollment-invitation-notify';
export const forgotPasswordEmailJob = 'forgot-password';
export const emailVerificationEmailJob = 'email-verification';

const emailFromName = 'Universiteams';

@Processor(emailQueueProcessor)
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

  @Process(emailVerificationEmailJob)
  async sendVerificationEmail(job: Job<User>) {
    const user = job.data;
    const verificationLink =
      await this.verificationEmailToken.generateVerifyEmailUrl(user);

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: emailFromName,
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

  @Process(forgotPasswordEmailJob)
  async sendForgetPasswordEmail(job: Job<User>) {
    const user = job.data;
    const verificationLink =
      await this.verificationEmailToken.generateForgetPasswordUrl(user);

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: emailFromName,
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

  @Process(enrollmentRequestEmailJob)
  async sendEnrollmentRequestNotifyEmail(
    job: Job<EnrollmentRequestNotifyEmailData>,
  ) {
    const enrollment = job.data;

    const adminEnrollments = await this.enrollmentRepository.find({
      where: {
        project: {
          id: enrollment.project.id,
        },
        role: In([ProjectRole.Admin, ProjectRole.Leader]),
        requestState: RequestState.Accepted,
      },
      relations: ['user'],
      select: ['user'],
    });

    for (const adminEnrollment of adminEnrollments) {
      this.logger.debug(
        `Sending enrollment request notify email to ${adminEnrollment.user.email}`,
      );

      const message: EmailMessage = {
        from: {
          email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
          name: emailFromName,
        },
        to: [
          {
            email: adminEnrollment.user.email,
            name: `${adminEnrollment.user.firstName} ${adminEnrollment.user.lastName}`,
          },
        ],
        subject: `Nueva Solicitud de Inscripción Recibida para tu Proyecto ${enrollment.project.name}`,
        text:
          `Hola,\n\n` +
          `Se ha recibido una nueva solicitud de inscripción de ${enrollment.user.user}.\n` +
          'Por favor revise la solicitud y tome las acciones necesarias.',
        html:
          `<h1>Hola,</h1>` +
          `<p>Se ha recibido una nueva solicitud de inscripción de ${enrollment.user.user}.</p>` +
          '<p>Por favor revise la solicitud y tome las acciones necesarias.</p>',
      };

      await this.emailSenders[this.selectedSender]
        .sendMail(message)
        .catch((err: Error) => {
          this.logger.error(err, err.message);
          throw err;
        });

      this.logger.debug(
        `Enrollment request notify email to ${adminEnrollment.user.email} successfully registered to be sent`,
      );
    }

    return {};
  }

  @Process(enrollmentInvitationEmailJob)
  async sendEnrollmentInvitationNotifyEmail(
    job: Job<EnrollmentInvitationNotifyEmailData>,
  ) {
    const enrollment = job.data;

    this.logger.debug(
      `Sending enrollment invitation notify email to ${enrollment.user.email}`,
    );

    const message: EmailMessage = {
      from: {
        email: `${this.config.get(SecretsVaultKeys.EMAIL_USER)}`,
        name: emailFromName,
      },
      to: [
        {
          email: enrollment.user.email,
          name: `${enrollment.user.firstName} ${enrollment.user.lastName}`,
        },
      ],
      subject: `Nueva Invitación de Inscripción Recibida del Proyecto ${enrollment.project.name}`,
      text:
        `Hola,\n\n` +
        `Se ha recibido una nueva invitación de inscripción a ${enrollment.project.name}.\n` +
        'Por favor revise la invitación y tome las acciones necesarias.',
      html:
        `<h1>Hola,</h1>` +
        `<p>Se ha recibido una nueva invitación de inscripción a ${enrollment.project.name}.</p>` +
        '<p>Por favor revise la invitación y tome las acciones necesarias.</p>',
    };

    await this.emailSenders[this.selectedSender]
      .sendMail(message)
      .catch((err: Error) => {
        this.logger.error(err, err.message);
        throw err;
      });

    this.logger.debug(
      `Enrollment invitation notify email to ${enrollment.user.email} successfully registered to be sent`,
    );

    return {};
  }
}
