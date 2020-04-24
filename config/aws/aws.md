



1 .  Grant access policy to IAM user role.

```$xslt

 AWSLambdaFullAccess

 AWSLambdaBasicExecutionRole

 AWSCloudFormationFullAccess

 AmazonAPIGatewayInvokeFullAccess

 AmazonAPIGatewayPushToCloudWatchLogs

 AmazonAPIGatewayAdministrator

 AmazonEC2FullAccess

 AmazonS3FullAccess

 IAMFullAccess

 CloudFrontFullAccess

 CloudFrontReadOnlyAccess
```


2 . Setup CORS and Bucket Policy in S3 Bucket



```
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Principal": "*",
            "Action": "*",
            "Resource": "arn:aws:s3:::tekie-tms-test/*"
        }
    ]
}
```

```$xslt

<?xml version="1.0" encoding="UTF-8"?>
<CORSConfiguration xmlns="http://s3.amazonaws.com/doc/2006-03-01/">
<CORSRule>
    <AllowedOrigin>*</AllowedOrigin>
    <AllowedMethod>PUT</AllowedMethod>
    <AllowedMethod>POST</AllowedMethod>
    <AllowedMethod>GET</AllowedMethod>
    <AllowedMethod>HEAD</AllowedMethod>
    <MaxAgeSeconds>3000</MaxAgeSeconds>
    <AllowedHeader>*</AllowedHeader>
</CORSRule>
</CORSConfiguration>


```


3 . Check serverless.yml for reference


---------------


1. Get access pair-key id from root user for cloudfront. 

2. Refer info.png for setting access related while creating a distribution in cloudfront

3. Check src/middlewares/utils/getSigned.js for reference




