#!/bin/bash


# This deploy script supports two modes:
# 1) SSH alias mode (preferred): provide an SSH host alias that is defined in
#    your SSH config (e.g. ~/.ssh/config). Set DEPLOY_SSH_HOST in .env or pass
#    the alias as the first CLI argument. The script will call rsync and allow
#    ssh to resolve HostName, User and Port from your SSH config.
# 2) Explicit mode: if no SSH alias is provided, the script uses explicit
#    variables: DEPLOY_HOST_NAME, DEPLOY_USER_NAME, DEPLOY_PORT (optional),
#    and DEPLOY_IDENTITY_FILE (optional) to construct an ssh command used by
#    rsync (-e 'ssh -p <port> -i <identity>').
# Priority: CLI arg > DEPLOY_SSH_HOST > explicit mode variables.

# Load environment variables (if .env exists)
if [ -f .env ]; then
    # shellcheck disable=SC1091
    source .env
fi

# Determine mode and variables
# If a positional arg is provided, treat it as the SSH alias first.
SSH_HOST=${1:-${DEPLOY_SSH_HOST:-""}}
SITE_PATH=${DEPLOY_SITE_PATH:-"~/public_html"}
BUILD_PATH=${DEPLOY_BUILD_PATH:-"./dist/"}

# Explicit-mode variables (used only when SSH_HOST is empty)
HOST_NAME=${DEPLOY_HOST_NAME:-""}
USER_NAME=${DEPLOY_USER_NAME:-""}
PORT=${DEPLOY_PORT:-"22"}
IDENTITY_FILE=${DEPLOY_IDENTITY_FILE:-""}

# (env already sourced above if present)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting site deployment...${NC}"

# Validate build directory exists
if [ ! -d "$BUILD_PATH" ]; then
    echo -e "${RED}Error: Build directory '$BUILD_PATH' does not exist${NC}"
    echo "Make sure you've run your Astro build first"
    exit 1
fi

# Check if build directory has content
if [ -z "$(ls -A "$BUILD_PATH")" ]; then
    echo -e "${RED}Error: Build directory '$BUILD_PATH' is empty${NC}"
    exit 1
fi

if [ -n "$SSH_HOST" ]; then
    echo -e "${YELLOW}Using SSH alias mode; syncing '$BUILD_PATH' to '$SSH_HOST:$SITE_PATH'${NC}"
    RSYNC_CMD="rsync -avz --delete-after"
    if [ -n "$DEPLOY_SSH_OPTIONS" ]; then
        RSYNC_CMD="$RSYNC_CMD -e \"ssh $DEPLOY_SSH_OPTIONS\""
    fi
    RSYNC_CMD="$RSYNC_CMD '$BUILD_PATH' '$SSH_HOST:$SITE_PATH'"
    echo -e "${YELLOW}Running: $RSYNC_CMD${NC}"
    if eval "$RSYNC_CMD"; then
        echo -e "${GREEN}✓ Deployment successful!${NC}"
        echo -e "${GREEN}Site updated at: $SSH_HOST${NC}"
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    fi
else
    # explicit mode: require host and user
    if [ -z "$HOST_NAME" ] || [ -z "$USER_NAME" ]; then
        echo -e "${RED}Error: explicit mode requires DEPLOY_HOST_NAME and DEPLOY_USER_NAME to be set${NC}"
        exit 1
    fi

    # expand ~ in identity file if present
    ID_PATH=""
    if [ -n "$IDENTITY_FILE" ]; then
        case "$IDENTITY_FILE" in
            ~/*) ID_PATH="$HOME/${IDENTITY_FILE#~/}" ;;
            *) ID_PATH="$IDENTITY_FILE" ;;
        esac
        if [ ! -f "$ID_PATH" ]; then
            echo -e "${RED}Error: identity file '$ID_PATH' does not exist${NC}"
            exit 1
        fi
    fi

    echo -e "${YELLOW}Using explicit mode; syncing '$BUILD_PATH' to '$USER_NAME@$HOST_NAME:$SITE_PATH'${NC}"

    # Build ssh command for rsync -e
    SSH_E="ssh -p $PORT"
    if [ -n "$ID_PATH" ]; then
        SSH_E="$SSH_E -i '$ID_PATH'"
    fi
    if [ -n "$DEPLOY_SSH_OPTIONS" ]; then
        SSH_E="$SSH_E $DEPLOY_SSH_OPTIONS"
    fi

    RSYNC_CMD="rsync -azv --delete-after -e '$SSH_E'"
    RSYNC_CMD="$RSYNC_CMD '$BUILD_PATH' '$USER_NAME@$HOST_NAME:$SITE_PATH'"

    echo -e "${YELLOW}Running: $RSYNC_CMD${NC}"

    if eval "$RSYNC_CMD"; then
        echo -e "${GREEN}✓ Deployment successful!${NC}"
        echo -e "${GREEN}Site updated at: $USER_NAME@$HOST_NAME${NC}"
    else
        echo -e "${RED}✗ Deployment failed${NC}"
        exit 1
    fi
# end
fi
