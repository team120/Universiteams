import { Injectable, Logger, Scope } from '@nestjs/common';

// Instantiating one logger per class avoid issues related to context registration
@Injectable({ scope: Scope.TRANSIENT })
export class AppLogger extends Logger {}
