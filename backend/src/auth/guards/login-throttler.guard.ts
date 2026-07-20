import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

// Default ThrottlerGuard keys purely by IP. Many students share one public IP
// (school NAT) and the Next.js server also fronts every request, so keying by
// IP alone throttles the whole school together instead of one abused account.
// Combining IP + the loginId being attempted means brute-forcing a single
// account is still capped, while different students trying different
// accounts from the same network never share a bucket.
@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const ip =
      (typeof forwardedFor === 'string' ? forwardedFor.split(',')[0].trim() : undefined) ||
      req.ip ||
      'unknown';
    const loginId =
      typeof req.body?.login === 'string' && req.body.login.trim()
        ? req.body.login.trim().toLowerCase()
        : 'unknown';
    return `${ip}:${loginId}`;
  }
}
