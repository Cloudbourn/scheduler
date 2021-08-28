ENVIRONMENT        ?= dev
PROJECT             = $(shell node -p 'require("./package.json").name')
AWS_DEFAULT_REGION ?= eu-west-1
BRANCH_NAME = "$(shell git branch | grep \* | cut -d ' ' -f2- | sed -E -e 's/\(|\)//g')"
COMMIT_HASH = $(shell git log -1 --format=%h)
TAGS = Environment=$(ENVIRONMENT) Project=$(PROJECT) GitBranch=$(BRANCH_NAME) GitCommit=$(COMMIT_HASH)
ARTIFACTS_BUCKET = irish-luck
STACK_NAME = $(PROJECT)-$(ENVIRONMENT)

package = aws cloudformation package \
    --template-file cloudformation.yml \
    --output-template-file dist/cloudformation.dist.yml \
    --s3-bucket $(ARTIFACTS_BUCKET) \
    --s3-prefix $(STACK_NAME)

deploy = aws cloudformation deploy --template-file dist/cloudformation.dist.yml \
    --stack-name $(STACK_NAME) \
    --region $(AWS_DEFAULT_REGION) \
    --parameter-overrides \
      $(shell node bin/cf-env.js) \
    --tags $(TAGS) \
    --capabilities CAPABILITY_IAM CAPABILITY_NAMED_IAM \
    --s3-bucket $(ARTIFACTS_BUCKET) \
    --s3-prefix $(STACK_NAME) \
    # --no-fail-on-empty-changeset

deploy:
	@echo "Resetting dist directory"
	@rm -rf dist
	@mkdir -p dist

	@echo "Building deployment package"
	@cp -r src dist/
	@cp package.json dist/src/package.json
	@cd dist/src/ && npm install --production

	@echo "Deploying"
	$(call package)
	$(call deploy)

	@echo "Cleaning up"
	@rm -rf dist
	@echo "Done!"
