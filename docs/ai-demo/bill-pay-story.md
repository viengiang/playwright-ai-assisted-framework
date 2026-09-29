# User story: Bill Pay

As a customer, I want to pay a bill to a payee from one of my accounts, so that the payee gets
paid and my account balance reflects the payment.

## Acceptance criteria

1. A logged-in customer can pay a payee by entering the payee's name, address, phone number and
   account number, the amount, and choosing the account to pay from.
2. After a successful payment the customer sees a confirmation that names the payee, the amount
   and the account it was paid from.
3. The paying account's balance decreases by exactly the amount paid, and the payment appears in
   that account's transactions.
4. The form refuses to submit when required information is missing and tells the customer which
   fields need attention.
5. The customer must confirm the payee's account number; if the two entries differ, the payment
   is not made.
