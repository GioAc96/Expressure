module.exports = ( policyName, policyMethod, req ) => {

	//Requiring policy
	
	const config = global.expressure.config;
	const policiesPath = config.appPath + config.paths.policies;
	const policy = require(`${policiesPath}/${policyName}Policy`);

	//Enforcing policy on request

	return policy[policyMethod](req);
	
}