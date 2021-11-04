# Serverless scheduler

A completely serverless, high-precision scheduler for ad hoc jobs.

## Deploying to AWS

> ⚠ **Warning**
>
> The scheduler exposes a public API that can be used by anyone. If you intend on deploying this project to production you should add an authorizer of your choice to the API Gateway.

1. Clone this repo

1. Copy `.example.env` to `.env`. Modify as you see fit.

1. Search-replace `irish-luck` in `MakeFile` with the name of your S3 bucket.

1. ```bash
    make deploy
    ```

## Usage

Send a POST request the to scheduler endpoint with at least the following payload:

```js
{
  "endpoint": "http://example.com/my-webhook",
  "scheduleAt": "2021-08-21T22:00:00.000+0200"
}
```

The scheduler will make a HTTP request to the defined endpoint soon after the timestamp.

## Architecture

A combination of DynamoDBs TTL and SQS' Message Delays is used to reach a precision close to seconds while maintaining a serverless approach that truly scales.

The Time-To-Live feature in DynamoDB has very [unpredictable accuracy](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/howitworks-ttl.html#:~:text=TTL%20typically%20deletes%20expired%20items%20within%2048%20hours%20of%20expiration), with delays ranging from a couple of minutes to up to 48 hours. What it lacks in precision it makes up for in its ability to schedule jobs far in advance, making it a great alternative for long term storage.

Similar to DynamoDB, SQS scales exceptionally well and is a very affordable service. The Delayed Message feature has precision to the second but you may only delay a message up to 15 minutes, so when a timer has less than 48 hours left it is continuously re-queued until it's time for the job to execute.

![Service diagram](./architecture.png)

## SaaS Alternatives

If you're not comfortable running your own service there are hosted schedulers that will do it for you. 💸

* [Cronhooks](https://cronhooks.io/) - One scheduled hook at a time included in free plan
* [Posthook](https://posthook.io/) - 500 free requests per month
