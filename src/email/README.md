# There is a sample email which will go by running
* npm run sampleEmail
* put the emailto, ccemail and bcc email if you want to check whether email is going to that email address

# In utils file there is Email Object which is like
* if html is empty then in the body text will be appear. Html is having higher precedence over text
* emailto should be in array. Can send the mail to mutiple people
* ccemail should be in array. Can send the mail to mutiple people
* bccemail should be in array. Can send the mail to mutiple people
* const emailMsg = {
  to: emailTo,
  cc: ccEmail,
  bcc: bccEmail,
  from: fromEmail,
  subject,
  text,
  html,
};

# In utils file , parsedHtmlFromTemplateFileAndObject will take two argument , first is the file name present in templates folder and the second is the object you want to replace with the value. It will pass the html and will return the html with replaced values

# there is a lodash function template which will be acting as a template engine and it consists of a object which will have all the variables you want to replace.

# emailObject will create an object which will have the different keys as mentioned above

# At last sgMail.send(emailObject) is a function which take an argument email object and will send the mail

# There is a sampleEmail present in email folder, you can check out the code so that we can know how it works
# SendEmail is a function which will take one argument in which the email object will be there and it will send the mail
