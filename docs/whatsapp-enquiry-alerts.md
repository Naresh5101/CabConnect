# WhatsApp enquiry alerts

The `submit-customer-request` Supabase Edge Function can send a WhatsApp template alert after a cab booking, tour quote, or temple tour enquiry has been saved. Customer uploads, driver applications, free-text notes, fare estimates, and precise coordinates are not sent in the alert. Enquiries remain saved in Supabase if WhatsApp is not configured or an alert fails.

## Meta setup

1. Create a Meta app using the WhatsApp use case and connect a WhatsApp Business Account.
2. Add and verify the business sender phone number in WhatsApp Manager. In API Setup, note its **Phone Number ID** and the **WABA ID**.
3. Add an approved Utility message template named `new_website_enquiry`, language `en`, with this body and five variables in this exact order:

   ```text
   New {{1}} enquiry
   Customer: {{2}}
   Mobile: {{3}}
   Reference: {{4}}
   Details: {{5}}
   ```

4. Add the receiving WhatsApp number as a test recipient to test first. For production, create a Meta System User, assign the app and WhatsApp Business Account assets, and generate a token with the WhatsApp messaging and management permissions Meta requires. Use Meta's current dashboard guidance; never commit the token to Git or put it in browser environment variables.

## Supabase secrets

In the production Supabase project, open **Edge Functions → Secrets** and set:

| Name | Value |
| --- | --- |
| `WHATSAPP_ACCESS_TOKEN` | Meta System User access token |
| `WHATSAPP_PHONE_NUMBER_ID` | ID of the business sender number (not the recipient number) |
| `WHATSAPP_ALERT_TO` | Admin recipient number in international format, digits only, e.g. `919876543210` |
| `WHATSAPP_TEMPLATE_NAME` | `new_website_enquiry` |
| `WHATSAPP_TEMPLATE_LANGUAGE` | `en` (must match the approved template language code) |
| `WHATSAPP_GRAPH_API_VERSION` | A currently supported Graph API version, e.g. `v23.0` |

Do not set `WHATSAPP_ALERT_TO` to the same number as the API sender. The Meta access token must remain a Supabase secret. Do not paste it into chat, the repository, Netlify variables, or frontend code.

The recipient gets the enquiry section, customer name and phone, database reference, and a short summary of trip details. WhatsApp delivery failures do not delete or reject the saved enquiry; check Supabase Edge Function logs for the HTTP status only.
