/**
 * 校验邀请码是否正确。
 * @param code 用户提交的邀请码
 * @returns valid=true 表示通过；valid=false 时附带 error 文案
 */
export function validateInvitationCode(
  code: string | undefined | null
): { valid: boolean; error?: string } {
  if (!code || code !== process.env.INVITATION_CODE) {
    return { valid: false, error: '邀请码无效' };
  }
  return { valid: true };
}
