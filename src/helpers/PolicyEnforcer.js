module.exports = ( policyName, policyMethod, req ) => {

	//Requiring policy
	
	const policiesPath = global.expressureConfig.appPath + global.expressureConfig.paths.policies;
	const policy = require(`${policiesPath}/${policyName}Policy`);

	//Enforcing policy on request

	return policy[policyMethod](req);
	
}