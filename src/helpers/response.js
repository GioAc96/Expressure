class ResponseHelpers {

	constructor( config ) {
		
		this.config = config
		this.errors = require(config.appPath + config.paths.errors);

	}
	//Send ok response
	ok(res, data = undefined) {

		if( data == undefined ) {
			res.send({
				ok: true
			});
		} else {
			res.send({
				ok: true,
				data: data
			});
		}

		return res.end();

	}

	//Send error response
	err(
		res,
		errorCode = 0,
		status = 520,
		msg = undefined,
		data
	) {

		//Setting status code
		res.status(status);

		if( typeof errorCode === 'string' || errorCode instanceof String ) {
			
			errorCode = this.errors[errorCode];
			
		}

		//Sending response
		res.send({
			ok: false,
			errorCode: errorCode,
			msg: msg,
			data: data
		});

		return res.end();

	}

	//Sends validation error
	validationError(
		res,
		errors,
		errorCode = 'VALIDATION_ERROR'
	) {
		
		return this.err(
			res,
			errorCode,
			400,
			null,
			errors
		)

	}

	//Sends unauthorized error on policy enforcement failure
	policyError(
		res,
		policyName,
		policyMethod,
		errorCode = 'POLICY_ERROR'
	) {

		return this.err(
			res,
			errorCode,
			403,
			null,
			{
				policyName: policyName,
				policyMethod: policyMethod
			}
		);
		
	}

}

module.exports = ResponseHelpers;