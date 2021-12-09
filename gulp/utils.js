function generateShellCmd (buildArg, qzdataPath, thingName, thingPath) {
	var baseCmd = "./__build.sh " + qzdataPath + " " + thingName + " "; // then commit? push? move s3 assets?

	switch (buildArg) {
		case "move":
			return baseCmd + "true false false false " + thingPath;
		case "commit":
			return baseCmd + "true true false false " + thingPath;
		case "push":
			return baseCmd + "true true true true " + thingPath;
		case "push-noS3":
			return baseCmd + "true true true false " + thingPath;
		case "s3":
			return baseCmd + "false false false true " + thingPath;

		default:
			return 'echo ""';
	}
}

module.exports = {
	generateShellCmd: generateShellCmd
};
