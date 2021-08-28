#!/usr/bin/env node

const dotenv = require('dotenv')
const path = require('path')

const environmentSpecificEnv = (
  process.env.ENVIRONMENT && dotenv.config({
    path: path.resolve(process.cwd(), `.${process.env.ENVIRONMENT}.env`),
  }).parsed
) || {}

// The most common values
const defaultEnv = dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
}).parsed || {}

// For CI values will be in env already,
// but we need to output the right keys by looking at .example.env
const fallbackEnv = dotenv.config({
  path: path.resolve(process.cwd(), '.example.env'),
}).parsed || {}

// The order of spreading isn't that important here because dotenv has
// already assigned stuff to process.env in the right order.
// However, for the sake of clarity its behavior is replicated here.
const env = { ...fallbackEnv, ...defaultEnv, ...environmentSpecificEnv }

Object.entries(env).forEach(([key, value]) => {
  console.log(`${key.replace(/_/g, '')}=${process.env[key] || value}`)
})
