package com.kabarent.notification;

final class EmailLayout {

    private EmailLayout() {}

    /**
     * Wraps a content card's inner HTML in the shared Cotton & Thread branded shell:
     * wordmark header, gold accent line, cream page background, white card, minimal footer.
     * Table-based layout with inline styles only — email clients ignore external CSS.
     */
    static String wrap(String innerHtml) {
        return """
                <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FDFBF5; padding:24px 0;">
                  <tr>
                    <td align="center">
                      <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px; max-width:100%%;" dir="rtl">
                        <tr>
                          <td align="center" style="padding:8px 24px 16px 24px;">
                            <span style="font-family:Arial, sans-serif; font-size:24px; font-weight:bold; color:#1C7C49;">KabaRent</span>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 24px;">
                            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0">
                              <tr><td style="height:2px; background-color:#FFC233; font-size:0; line-height:0;">&nbsp;</td></tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:24px;">
                            <table role="presentation" width="100%%" cellpadding="0" cellspacing="0" border="0" style="background-color:#FFFFFF; border-radius:8px;">
                              <tr>
                                <td style="padding:24px; font-family:Arial, sans-serif; color:#1C1B16; text-align:right;" dir="rtl">
                                  %s
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                        <tr>
                          <td align="center" style="padding:16px 24px 8px 24px; font-family:Arial, sans-serif; font-size:12px; color:#5A5443;">
                            KabaRent &mdash; מערכת השכרת קבות
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
                """.formatted(innerHtml);
    }
}
