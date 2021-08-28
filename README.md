# Serverless scheduler

A serverless scheduler-as-a-service for one-time jobs that don't require too much precision.

## Deploying to AWS

1. Clone this repo

1. Copy `.example.env` to `.env`. Modify as you see fit.

1. Search-replace `irish-luck` in `MakeFile` with the name of your S3 bucket.

1. ```bash
    make deploy
    ```

## Usage


> ⚠ **Warning**
>
> The scheduler exposes a public API that can be used by anyone. It is not recommended that you deploy this project unless you are aware of the associated risks.

Send a POST request the to scheduler endpoint with at least the following payload:

```js
{
  "endpoint": "http://example.com/my-webhook",
  "executeAt": "2021-08-21T22:00:00.000Z"
}
```

The scheduler will make a HTTP request to the defined endpoint soon after the timestamp<sup>1</sup>.


**<sup>1</sup> )** ["TTL typically deletes expired items within 48 hours of expiration."](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/howitworks-ttl.html#:~:text=TTL%20typically%20deletes%20expired%20items%20within%2048%20hours%20of%20expiration)
