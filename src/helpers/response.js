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
		msg = undefined
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
			msg: msg
		});

		return res.end();

	}

}

module.exports = ResponseHelpers;