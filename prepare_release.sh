#!/bin/bash

VERSION=$1

# Check if an argument is provided
if [ -z "$VERSION" ]; then
    echo "Error: No version number provided."
    echo "Usage: $0 <version>"
    exit 1
fi

# Check if the argument is a valid version number - if yes echo the version number if no exit with an error message
if [[ "$VERSION" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
    echo "Valid version number: $VERSION"
else
    echo "Error: Invalid version number format."
    echo "Usage: $0 <version>"
    exit 1
fi

# tag should start with a 'v'
TAG="v$VERSION"

# Check if the tag already exists
if git rev-parse -q --verify "refs/tags/$TAG" >/dev/null; then
    echo "Error: Tag $TAG already exists."
    exit 1
fi

# Check if the working directory is clean
if [ -n "$(git status --porcelain)" ]; then
    echo "Error: Working directory not clean."
    exit 1
fi

# Check if the current branch is main
if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
    echo "Error: Not on main branch."
    exit 1
fi

# Update the version number in the package.json file
sed -i '' -e "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package.json

# Update the version number in the package-lock.json file
sed -i '' -e "s/\"version\": \".*\"/\"version\": \"$VERSION\"/" package-lock.json

# Commit the changes
git add package.json package-lock.json
git commit -m "Update version to $VERSION"
git tag -a $TAG -m "Release version $VERSION"

echo "Version updated to $VERSION and tagged in Git."
echo ""
echo "If this was a mistake, you can run"
echo "  git reset --soft HEAD~1"
echo "  git tag -d ${TAG}"
