import { describe, it, expect } from 'vitest';
import { validateInvitationCode } from '@/lib/invitation';

// vitest.config.ts 已通过 dotenv 加载 .env，INVITATION_CODE="F2Z4Q6"
const VALID_CODE = 'F2Z4Q6';

describe('validateInvitationCode', () => {
  it('正确邀请码 → { valid: true }', () => {
    const result = validateInvitationCode(VALID_CODE);
    expect(result.valid).toBe(true);
    expect(result.error).toBeUndefined();
  });

  it('错误邀请码 → { valid: false, error: "邀请码无效" }', () => {
    const result = validateInvitationCode('WRONG');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('邀请码无效');
  });

  it('空字符串 → { valid: false, error: "邀请码无效" }', () => {
    const result = validateInvitationCode('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('邀请码无效');
  });

  it('undefined / null → { valid: false, error: "邀请码无效" }', () => {
    expect(validateInvitationCode(undefined)).toEqual({
      valid: false,
      error: '邀请码无效',
    });
    expect(validateInvitationCode(null)).toEqual({
      valid: false,
      error: '邀请码无效',
    });
  });
});
