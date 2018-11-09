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
	
	constructor({
		
		validationSchema,
		stopOnError = true

	}) {
		
		//Saving validationSchema in object
		this.validationSchema = validationSchema;

		//Initializing validation errors holder
		this._errors = {};

		//Setting validation method
		this.validate = stopOnError ? this._validateStopOnError : this._validateContinueOnError;
		
		//Loading default validation rules
		this.loadDefaultRules();

	}

	/**
	 * Adds error to the validation report
	 * @param {String} fieldName Name of the field that failed validation
	 * @param {String} ruleName Name of the rule that generated the validation error
	 */
	_addError( fieldName, ruleName ) {
		
		if( typeof this._errors[ fieldName ] === 'undefined' ) {
			
			this._errors[ fieldName ] = new Array;

		}

		this._errors[ fieldName ].push( ruleName );

	}
	
	/**
	 * Validates the current request and stops at the first validation error
	 * @param {Express request} req Current request Object
	 */
	_validateStopOnError( req ) {
		
		//Cleaning previous validation errors
		this._errors = {};
		
		//Iterating over every field
		for( const field in this.validationSchema )
		if( this.validationSchema.hasOwnProperty( field ) ) {
			
			//Field has validation
			const value = req.data[ field ];
			
			const fieldValidationSchema = this.validationSchema[ field ]

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

	/**
	 * Validates the current request without stopping at the first validation error
	 * @param {Express request} req Current request Object
	 */
	_validateContinueOnError( req ) {
		
		//Cleaning previous validation errors
		this._errors = {};
		
		//Iterating over every field
		for( const field in this.validationSchema )
		if( this.validationSchema.hasOwnProperty( field ) ) {
			
			//Field has validation
			const value = req.data[ field ];
			
			const fieldValidationSchema = this.validationSchema[ field ]

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
						this._addError( field, ruleName );
						
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
	
	/**
	 * Applies a validation rule, and returns a boolean representing wether the field passed the rule checking
	 * @param {String} ruleName Name of the validation rule to apply
	 * @param {any} value Value of the field to validate
	 * @param {Object} params Validation rule parameters
	 */
	_applyRule( ruleName, value, params ) {
		
		const result = this.rules[ ruleName ]( value, params );
		return result;
		
	}
	
	/**
	 * Loads basic validation rules
	 */
	loadDefaultRules() {
		
		this.rules = {
			
			//The value is required
			required: ( value ) => {

				return ! (value === undefined || value === null || value === '');
				
			},
	
			//Field should be numeric
			numeric: ( value ) => {
				
				return ! isNaN ( parseFloat( value ) ) && isFinite( value );
	
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
	
				return value >= params.min && value <= params.max;
	
			},

			//Field length should be between a max and a min
			lBetween: ( value, params ) => {

				return value.length >= params.min && value.length <= params.max

			},

			//Field value represents a model that should exist in the database
			exists: async ( value, params ) => {
				
				//Counting models
				const modelCount = await params.model.countDocuments({ _id: value });

				return modelCount > 0;
				

			}
	
	
		}
		
	}

	/**
	 * Extends the validator with custom validation rules
	 * @param {String} ruleName Name of the rule to add
	 * @param {Callback} callback Rule body
	 */
	extend( ruleName, callback ) {
		
		this.rules[ ruleName ] = callback;
		

	}

	/**
	 * Returns the validation errors that occured with the current request
	 */
	getErrors() {
		
		return this._errors;

	}

	/**
	 * Returns a boolean representing wether the current request has generated validation errors
	 */
	hasErrors() {
		
		return Object.keys(this._errors).length > 0;

	}
	
}

module.exports = Validator;