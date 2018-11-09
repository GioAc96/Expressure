module.exports = {

	/**
	 * Sends an ok response
	 * @param {Express response} res Express response object
	 * @param {Object} data Data to send
	 */
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

	},

	/**
	 * Sends an error response
	 * @param {Express response} res Express response object
	 * @param {Int, String} errorCode Error code
	 * @param {Int} status HTTP Status code
	 * @param {String} msg Error message
	 * @param {Object} data Data to send along the response
	 */
	err(
		res,
		errorCode = 0,
		status = 520,
		msg,
		data
	) {

		//Setting status code
		res.status(status);

		//Looking for error code in errors
		if( typeof errorCode === 'string' || errorCode instanceof String ) {
		
			errorCode = global.expressureConfig.errors[ errorCode ] || 0;
			
		}

		//Sending response
		res.send({
			ok: false,
			errorCode: errorCode || 0,
			msg: msg,
			data: data
		});

		return res.end();

	},

	/**
	 * Sends a validation error response
	 * @param {Express response} res Express response object
	 * @param {Object} errors Validation errors data
	 * @param {Int} errorCode Error code
	 */
	validationError(
		res,
		errors,
		errorCode = 'VALIDATION_ERROR'
	) {
		
		return global.expressure.helpers.response.err(
			res,
			errorCode,
			400,
			undefined,
			errors
		)

	},

	/**
	 * Sends a policy enforcement failed error
	 * @param {Express response} res Express response object
	 * @param {String} policyName Name of the policy
	 * @param {String} policyMethod Name of the policy method
	 * @param {String} errorCode Error code
	 */
	policyError(
		res,
		policyName,
		policyMethod,
		errorCode = 'POLICY_ERROR'
	) {

		return global.expressure.helpers.response.err(
			res,
			errorCode,
			403,
			undefined,
			{
				policyName: policyName,
				policyMethod: policyMethod
			}
		);
		
	}


}