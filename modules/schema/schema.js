/* jslint node: true */
'use strict';
// Fire me up!

module.exports = {
	implements: 'schema',
	inject: [ 'require(bluebird)', 'require(util)', 'objhelper', 'schema/error', 'schema/pattern:*' ]
};

module.exports.factory = function( P, util, oh, SchemaError, extPattern ) {


	// Prepare external pattern
	var pattern = {};
	for( var p in extPattern ) oh.append( pattern, extPattern[p] );


	// Factory
	return function( schema, ignoreUndefinedFields ) {

		// Resolve external patterns
		for( var s in schema ) {
			if( pattern[ schema[s].type ] ) {
				schema[s].pattern = pattern[ schema[s].type ];
				schema[s].type = 'string';
			}
		}

		// Return check function (with fancy promises)
		return function( obj ) { return new P( function( resolve, reject ) {

			var test = oh.depack( obj );

			// Check for missing fields that are mandatory
			for( var i in schema ) {
				if( test[i] === undefined ) {
					if( schema[i].mandatory ) {
						return reject( new SchemaError(
							'missing-field',
							"Field " + i + " is missing."
						) );
					} else if( schema[i].default !== undefined ) {
						if( schema[i].type == 'object' ) {
							// If type is object it must be handled a little bit different ...

							// Search for childs
							var found = false;
							Object.keys(test).forEach( function( k ) {
								found = found || k.substr( 0, i.length ) == i;
							} );

							// If child exists --> Roger that!
							if( found ) continue;

							// Else -> copy default to object
							test[i] = {};
							var defaultObj = oh.depack( schema[i].default );
							for( var key in defaultObj ) {
								// Make sure arrays are copied
								if( defaultObj[ key ] instanceof Array ) {
									test[ i + '.' + key ] = defaultObj[ key ].slice();
								} else {
									test[ i + '.' + key ] = defaultObj[ key ];
								}
							}
						} else {
							test[i] = schema[i].default;
						}
					}
				}
			}

			// Array pattern matcher
			var arrayPattern = /\[[0-9]+\]/g;

			// Check for undefined or check pattern
			for( i in test ) {

				// If item iterater contains array pattern, create an wildcard for schema matching
				var iSchema = i.replace( arrayPattern, '[]' );

				// Check whether field is defined in schema
				if( ! schema[iSchema] ) {

					// Let undefined fields pass if they should be ignored
					if( ignoreUndefinedFields ) continue;

					// If it's not defined, check for wildcard schema
					var path = i.split( '.' );

					// Iterate through path and search for wildcards (type=="object")
					var ok = false;
					while( path.length > 1 ) {
						path.splice( path.length - 1, 1 );
						var x = path.join( '.' );
						if( schema[x] ) {
							ok = (schema[x].type == "object");
							break;
						}
					}

					// No wildcard found
					if( ! ok ) return reject( new SchemaError(
						'illegal-field',
						"Field " + i + " not allowed."
					) );

					// Its okay --> check next one
					continue;
				}

				var type = oh.gettype( test[i] );

				// Check for right data type
				if( schema[iSchema].type && type != schema[iSchema].type ) {
					return reject( new SchemaError(
						'wrong-type',
						"Field " + i + " has wrong type! " + schema[iSchema].type + " expected."
					) );
				}

				// Check for value
				if( type == 'number' && schema[iSchema].min !== undefined ) {
					if( test[i] < schema[iSchema].min ) {
						return reject( new SchemaError(
							'min-value-dropped-below',
							"Field " + i + " is too small!"
						) );
					}
				}
				if( type == 'number' && schema[iSchema].max !== undefined ) {
					if( test[i] > schema[iSchema].max ) {
						return reject( new SchemaError(
							'max-value-exceeded',
							"Field " + i + " is too large!"
						) );
					}
				}

				// Check for length
				if( type == 'string' && schema[iSchema].min !== undefined ) {
					if( test[i].length < schema[iSchema].min ) {
						return reject( new SchemaError(
							'min-length-dropped-below',
							"Field " + i + " is too short!"
						) );
					}
				}
				if( type == 'string' && schema[iSchema].max !== undefined ) {
					if( test[i].length > schema[iSchema].max ) {
						return reject( new SchemaError(
							'max-length-exceeded',
							"Field " + i + " is too long!"
						) );
					}
				}

				// Check for pattern
				if( type == 'string' && schema[iSchema].pattern ) {
					if( oh.gettype( schema[iSchema].pattern ) == "string" ) {
						schema[iSchema].pattern = new RegExp( schema[iSchema].pattern );
					}

					if( ! schema[iSchema].pattern.test( test[i] ) ) {
						return reject( new SchemaError(
							'wrong-format',
							"Field " + i + " has wrong format!"
						) );
					}
				}
			}

			return resolve( oh.pack( test ) );

		} ); };
	};
};
