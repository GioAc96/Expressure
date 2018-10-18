/* Validation schema sample
const validationSchema = {
	field1: {
		
		required: true,
		numeric: true,
		between: {
			min: 5,
			max: 6
		},
		
	}
}*/

class Validator {
	
	constructor( req, stopOnError = true ) {
		
		//Saving request object in memory
		this.req = req;

		//Initializing validation errors holder
		this._errors = {};
		
		//Writing method to get request parameters
		if( req.method == 'GET' ) {
			
			this._getField = ( fieldName ) => {
				return this.req.query[ fieldName ];
			}
			
		} else {
			
			this._getField = ( fieldName ) => {
				return this.req.params[ fieldName ] || undefined;
			}
			
		}

		//Setting validation method
		this.validate = stopOnError ? this._validateStopOnError : this._validateContinueOnError;
		
		//Loading default validation rules
		this.loadDefaultRules();

	}

	//Function used to add error to the validation report
	_addError( fieldName, ruleName ) {
		
		if( typeof this._errors[ fieldName ] === 'undefined' ) {
			
			this._errors[ fieldName ] = new Array;

		}

		this._errors[ fieldName ].push( ruleName );

	}
	
	//Function used to get validation response according to the validation schema provided
	//This version of the function stops on the first validation error
	_validateStopOnError( validationSchema ) {

		//Cleaning previous validation errors
		this._errors = {};
		
		//Iterating over every field
		for( const field in validationSchema )
		if( validationSchema.hasOwnProperty( field ) ) {
			
			//Field has validation
			const value = this._getField( field );
			
			const fieldValidationSchema = validationSchema[ field ]

			//Check wether field is present
			if( this._applyRule('required', value) ){
				
				//Field is present. Removing required from validation schema since it was already checked
				delete fieldValidationSchema.required

				//Iterating over validation rules of field
				for( const ruleName in fieldValidationSchema ) 
				if( fieldValidationSchema.hasOwnProperty( ruleName ) ) {
					
					//Checking wether rule validation fails
					if( ! this._applyRule( ruleName, value, fieldValidationSchema[ ruleName ] )) {
						
						//Saving errors
						this._addError( field, ruleName);

						//Rule validation fails, returning false
						return false;
						
					}
				
				}

			} else {
				
				//Field is not present. Checking wether field was required
				if( fieldValidationSchema.hasOwnProperty('required') ) {

					//Saving errrors
					this._addError( field, 'required');
					
					//Field is required, but not present
					return false;

				}

			}
			
			
		}
		
		//All validation rules passed
		return true;
		
	}

	//Function used to get validation response according to the validation schema provided
	//This version of the function does not stop on validation errors
	_validateContinueOnError( validationSchema ) {

		//Cleaning previous validation errors
		this._errors = {};
		
		//Iterating over every field
		for( const field in validationSchema )
		if( validationSchema.hasOwnProperty( field ) ) {
			
			//Field has validation
			const value = this._getField( field );
			
			const fieldValidationSchema = validationSchema[ field ]

			//Check wether field is present
			if( this._applyRule('required', value) ){
				
				//Field is present. Removing required from validation schema since it was already checked
				delete fieldValidationSchema.required

				//Iterating over validation rules of field
				for( const ruleName in fieldValidationSchema ) 
				if( fieldValidationSchema.hasOwnProperty( ruleName ) ) {
					
					//Checking wether rule validation fails
					if( ! this._applyRule( ruleName, value, fieldValidationSchema[ ruleName ] )) {
						
						//Saving errors
						this._addError( field, ruleName);
						
					}
				
				}

			} else {
				
				//Field is not present. Checking wether field was required
				if( fieldValidationSchema.hasOwnProperty('required') ) {

					//Saving errrors
					this._addError( field, 'required');

				}

			}
			
		}

		
		const result =  ! this.hasErrors();

		return result;
		
	}
	
	//Checking wether val
	_applyRule( ruleName, value, params ) {
		
		const result = this.rules[ ruleName ]( value, params );
		return result;
		
	}
	
	loadDefaultRules() {
		
		this.rules = {
			
			//The value is required
			required: ( value ) => {

				return ! (value === undefined || value === null || value === '');
				
			},
	
			//Field should be numeric
			numeric: ( value ) => {
				
				return ! isNaN ( parseFloat( value ) ) && isFinite(value);
	
			},
	
			//Field should be an integer
			integer: ( value ) => {
	
				return Number.isInteger( value );
	
			},
	
			//Field should be a string
			string: ( value ) => {
	
				return typeof value === 'string' || value instanceof String;
	
			},
	
			//Field value should be between a max and a min
			between: ( value, params ) => {
	
				return value <= params.max && value >= params.min;
	
			},
	
	
		}
		
	}

	//Function used to define custom validation rules
	extend( ruleName, callback ) {
		
		this.rules[ ruleName ] = callback;
		

	}

	//Function used to get list of validation errors
	getErrors() {
		
		return this._errors;

	}

	//Function used to check if there are any validation errors
	hasErrors() {
		
		return Object.keys(this._errors).length !== 0;

	}
	
}

module.exports = Validator;