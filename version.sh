NEW_VERSION=$npm_package_version

if [ -n "$NEW_VERSION" ]; then
    npm run changelog
    git add CHANGELOG.md
    echo "Updated CHANGELOG.md"

else
    echo "Script can only be run as npm version hook"
fi
