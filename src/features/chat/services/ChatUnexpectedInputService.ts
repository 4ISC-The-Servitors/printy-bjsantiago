import { insertMessageV2 } from '@features/chat/api/jsonbChatFlowApi';

export class ChatUnexpectedInputService {
  private static readonly CUSTOMER_WARNING_TEXT =
    "Unfortunately, I can't answer that. For further assistance, please create a support ticket by clicking Ask Assistance in your dashboard so our admin team can assist you.";
  private static readonly ADMIN_WARNING_TEXT =
    "Unfortunately, I can't answer that from this step. Please use the options above or provide the requested details to continue.";
  private static readonly UPLOAD_EXPECTED_WARNING_TEXT =
    'Looks like this step needs a file upload. Please use the attachment button to add up to 3 files (max 10MB each). Text messages will not work for this step.';

  // Export warning text for client-side checking
  static readonly ADMIN_WARNING_TEXT_CLIENT =
    "Unfortunately, I can't answer that from this step. Please use the options above or provide the requested details to continue.";

  static getCustomerWarningText(): string {
    return this.CUSTOMER_WARNING_TEXT;
  }

  static getAdminWarningText(): string {
    return this.ADMIN_WARNING_TEXT;
  }

  static getUploadExpectedWarningText(): string {
    return this.UPLOAD_EXPECTED_WARNING_TEXT;
  }

  static async sendCustomerWarning(sessionId: string): Promise<boolean> {
    try {
      const { messageId } = await insertMessageV2({
        sessionId,
        text: this.CUSTOMER_WARNING_TEXT,
        role: 'printy',
        nodeId: null,
      });
      return Boolean(messageId);
    } catch (err) {
      console.error(
        '[ChatUnexpectedInputService] Failed to send warning:',
        err
      );
      return false;
    }
  }

  static async sendAdminWarning(sessionId: string): Promise<boolean> {
    try {
      const { messageId } = await insertMessageV2({
        sessionId,
        text: this.ADMIN_WARNING_TEXT,
        role: 'printy',
        nodeId: null,
      });
      return Boolean(messageId);
    } catch (err) {
      console.error(
        '[ChatUnexpectedInputService] Failed to send admin warning:',
        err
      );
      return false;
    }
  }

  static async sendUploadExpectedWarning(sessionId: string): Promise<boolean> {
    try {
      const { messageId } = await insertMessageV2({
        sessionId,
        text: this.UPLOAD_EXPECTED_WARNING_TEXT,
        role: 'printy',
        nodeId: null,
      });
      return Boolean(messageId);
    } catch (err) {
      console.error(
        '[ChatUnexpectedInputService] Failed to send upload warning:',
        err
      );
      return false;
    }
  }
}
