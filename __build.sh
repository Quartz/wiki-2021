#!/bin/bash
# set -e

CURR_COMMIT=$(git log --oneline -n 1)
PROJECT_PATH=$(pwd)
PROJECT_DIR=$7

AWS_ASSET_FILES=(${PROJECT_PATH}/src/aws-assets/*)
AWS_DATA_FILES=(${PROJECT_PATH}/src/aws-data/*)

mkdir -p $1

cd $1
QZTHINGS_BRANCH=$(git rev-parse --abbrev-ref HEAD)

printf '%s\n'
printf '\e[0;35m%s\e[0m\n' "Executing pull of qz-things from origin:${QZTHINGS_BRANCH}"
printf '%s\n' -------------------------
echo `git pull origin ${QZTHINGS_BRANCH}`

cd -
if [[ "$3" = true ]]; then
	printf '%s\n'
	printf '\e[0;35m%s\e[0m\n' "Copying built files to qz-things repo"
	printf '%s\n' -------------------------
	cp -rv ./build/* $1
fi

cd $1
if [[ "$4" = true ]]; then
	printf '%s\n'
	printf '\e[0;35m%s\e[0m\n' "Committing ${CURR_COMMIT} to origin:${QZTHINGS_BRANCH}"
	printf '%s\n' -------------------------
	git add .
	git commit -m "built: ${2} | ${CURR_COMMIT}"
fi


if [[ "$5" = true ]]; then
	printf '%s\n'
	printf '\e[0;35m%s\e[0m\n' "Pushing to origin:${QZTHINGS_BRANCH}"
	printf '%s\n' -------------------------
	git push origin ${QZTHINGS_BRANCH}
fi


cd -


if [ "$6" = true ] && [ ${#AWS_ASSET_FILES[@]} -gt 0 ] && [ ${#AWS_DATA_FILES[@]} -gt 0 ]; then
	
	printf '%s\n'
	printf '\e[0;35m%s\e[0m\n' "Transfering new and modified files to S3"
	printf '%s\n' -------------------------
	aws s3 sync ${PROJECT_PATH}/src/aws-assets s3://things-assets.qz.com${PROJECT_DIR}/assets --exclude '_placeholder'
	aws s3 sync ${PROJECT_PATH}/src/aws-data s3://things-assets.qz.com${PROJECT_DIR}/data --exclude '_placeholder'

	printf '%s\n'
	printf '\e[0;35m%s\e[0m\n' "Some of your files are available in the following locations:"
	
	if [ ${#AWS_ASSET_FILES[@]} -gt 0 ]; then 
		printf '%s\n' https://things-assets.qz.com${PROJECT_DIR}/assets/
	fi

	if [ ${#AWS_DATA_FILES[@]} -gt 0 ]; then
		printf '%s\n' https://things-assets.qz.com${PROJECT_DIR}/data/
	fi
fi

if [[ "$5" = true ]]; then
	
	printf '%s\n'
	cd ./build
	HTML_FILES=$(ls *.html | grep -v "info.html")
	printf '\e[1;32m%s\e[0m\n' "================================================"
	printf '\e[1;32m%s\e[0m\n' "++++++++ Your project has been deployed ++++++++"
	printf '\e[1;32m%s\e[0m\n' "================================================"
	printf '%s\n'
	printf '\e[0;32m%s\e[0m\n' "These are html files in the project’s directory:"
	printf 'https://things.qz.com'${PROJECT_DIR}'/%s\n' $HTML_FILES

	printf '%s\n'
	printf '\e[0;32m%s\e[0m\n' "Your medium-sized embed short-codes:"
	printf '[qz-interactive url="https://things.qz.com'${PROJECT_DIR}'/%s" size="medium"]\n' $HTML_FILES

	printf '%s\n'
	printf '\e[0;32m%s\e[0m\n' "Your large-sized embed short-codes:"
	printf '[qz-interactive url="https://things.qz.com'${PROJECT_DIR}'/%s" size="large"]\n' $HTML_FILES

	# printf '%s\n'
	# printf '\e[0;32m%s\e[0m\n' "Your extra-large-sized embed short-codes:"
	# printf '[qz-interactive url="https://things.qz.com'${PROJECT_DIR}'/%s" size="x-large"]\n' $HTML_FILES
	printf '%s\n'
	cd -
	printf '%s\n'
	
fi

