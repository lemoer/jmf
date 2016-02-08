var should = require( 'should' );
var fireup = require( 'fire-up' ).newInjector( {
	basePath: __dirname + '/..',
	bustRequireCache: true,
	require: require,
	modules: [
		'./modules/hooks/*.js',
		'./modules/schema/*.js',
		'./modules/objhelper/*.js'
	]
} );

var schema;

describe( "Module schema", function() {
	before( function( done ) {
		// Fetch Schema Module
		fireup( 'schema' ).then( function( m ) {
			schema = m;
			done();
		} );
	} );

	it( "should set missing field to default", function( done ) {
		var test = schema( {
			'field': { default: 'test' }
		} );

		test( {} ).then( function( e ) {
			e.field.should.eql( 'test' );
			done();
		} );
	} );

	it( "should set missing object to default", function( done ) {
		var test = schema( {
			'field': { type: 'object', default: { sub: [1] } }
		} );

		test( {} ).then( function( e ) {
			e.field.sub[0].should.eql( 1 );
			done();
		} );
	} );

	it( "should apply default to array items", function( done ) {
		var test = schema( {
			'arr[].foo': { default: 'bar' }
		} );

		test( { arr: [ {}, { foo: 'baz' } ] } ).then( function ( e ) {
			e.arr[0].foo.should.eql( 'bar' );
			e.arr[1].foo.should.eql( 'baz' );
			done();
		} );
	} );

	it( "should set missing sub-sub-field to default", function( done ) {
		var test = schema( {
			'field.sub.subfield': { default: 'test' }
		} );

		test( {} ).then( function( e ) {
			e.field.sub.subfield.should.eql( 'test' );
			done();
		} );
	} );

	it( "should complain missing field", function( done ) {
		var test = schema( {
			'field': { mandatory: true }
		} );

		test( {} ).catch( function( e ) {
			e.type.should.eql( 'missing-field' );
			done();
		} );
	} );

	it( "should complain missing sub-field", function( done ) {
		var test = schema( {
			'field.subfield': { mandatory: true }
		} );

		test( { 'field' : {} } ).catch( function( e ) {
			e.type.should.eql( 'missing-field' );
			done();
		} );
	} );

	it( "should complain missing sub-sub-field", function( done ) {
		var test = schema( {
			'field.subfield.subsubfiled': { mandatory: true }
		} );

		test( { 'field' : { 'subfield': {} } } ).catch( function( e ) {
			e.type.should.eql( 'missing-field' );
			done();
		} );
	} );

	it( "should not complain missing non-mandatory field", function( done ) {
		var test = schema( {
			'field': { mandatory: false }
		} );

		test( {} ).then( function() {
			done();
		} );
	} );

	it( "should not complain about defined field", function( done ) {
		var test = schema( {
			field: {}
		} );

		test( { 'field' : 'test' } ).then( function() {
			done();
		} );
	} );

	it( "should complain undefined field", function( done ) {
		var test = schema( {
		} );

		test( { 'field' : 'test' } ).catch( function( e ) {
			e.type.should.eql( 'illegal-field' );
			done();
		} );
	} );

	it( "should not complain about defined array field (implicit)", function( done ) {
		var test = schema( {
			'arr[]': {}
		} );

		test( { 'arr': [ 23, 42, 1337 ] } ).then( function( ) {
			done();
		} );
	} );

	it( "should not complain about defined array field (explicit)", function( done ) {
		var test = schema( {
			'arr': {}
		} );

		test( { 'arr': [ 23, 42, 1337 ] } ).then( function( ) {
			done();
		} );
	} );


	it( "should complain about undefined fields in array", function( done ) {
		var test = schema( {
			'arr[]': {}
		} );

		test( { 'arr': [{ foo: 'baz' }] } ).catch( function( e ) {
			e.type.should.eql( 'illegal-field' );
			done();
		} );
	} );

	it( "should complain about undefined sub-sub-fields", function( done ) {
		var test = schema( {
			testing: {}
		} );

		test( { testing: { a: { subsubfield: {} } } } ).catch( function( e ) {
			e.type.should.eql( 'illegal-field' );
			done();
		} );
	} );

	it( "should not complain undefined field if they should be ignored", function( done ) {
		var test = schema( { }, true );

		test( { 'field' : 'test' } ).then( function() {
			done();
		} );
	} );

	it( "should not complain undefined field within object (wildcard)", function( done ) {
		var test = schema( {
			'field': { type: 'object', default: {} }
		} );

		test( { 'field' : { 'test': 1 } } ).then( function( e ) {
			e.field.test.should.eql( 1 );
			done();
		} );
	} );

	it( "should complain wrong type (boolean)", function( done ) {
		var test = schema( {
			'field': { type: 'boolean', mandatory: true }
		} );

		test( { 'field': 0 } ).catch( function( e ) {
			e.type.should.eql( 'wrong-type' );
			done();
		} );
	} );

	it( "should complain wrong type (number)", function( done ) {
		var test = schema( {
			'field': { type: 'number' }
		} );

		test( { 'field': 'test' } ).catch( function( e ) {
			e.type.should.eql( 'wrong-type' );
			done();
		} );
	} );

	it( "should complain wrong type (string)", function( done ) {
		var test = schema( {
			'field': { type: 'string' }
		} );

		test( { 'field': ['test'] } ).catch( function( e ) {
			e.type.should.eql( 'wrong-type' );
			done();
		} );
	} );

	it( "should complain wrong type (array)", function( done ) {
		var test = schema( {
			'field': { type: 'array' }
		} );

		test( { 'field': true } ).catch( function( e ) {
			e.type.should.eql( 'wrong-type' );
			done();
		} );
	} );

	it( "should accept right type (boolean)", function( done ) {
		var test = schema( {
			'field': { type: 'boolean' }
		} );

		test( { 'field': true } ).then( function( ) {
			done();
		} );
	} );

	it( "should accept right type (number)", function( done ) {
		var test = schema( {
			'field': { type: 'number' }
		} );

		test( { 'field': 1 } ).then( function( e ) {
			done();
		} );
	} );

	it( "should accept right type (string)", function( done ) {
		var test = schema( {
			'field': { type: 'string' }
		} );

		test( { 'field': 'test' } ).then( function( ) {
			done();
		} );
	} );

	it( "should accept right type (array)", function( done ) {
		var test = schema( {
			'field': { type: 'array' }
		} );

		test( { 'field': [true] } ).then( function( ) {
			done();
		} );
	} );

	it( "should not complain about the type of undefined fields", function( done ) {
		var test = schema( {
			'field': { type: 'string' }
		} );

		test( {} ).then( function( ) {
			done();
		} );
	} );

	it( "should complain wrong pattern", function( done ) {
		var test = schema( {
			'field': { type: 'string', pattern: '^#[0-9a-f]{6}$' }
		} );

		test( { 'field': '#aa994g' } ).catch( function( e ) {
			e.type.should.eql( 'wrong-format' );
			done();
		} );
	} );

	it( "should accept right pattern", function( done ) {
		var test = schema( {
			'field': { type: 'string', pattern: '^#[0-9a-f]{6}$' }
		} );

		test( { 'field': '#aa994f' } ).then( function( ) {
			done();
		} );
	} );

	it( "should complain wrong predefined pattern", function( done ) {
		var test = schema( {
			'field': { type: 'color' }
		} );

		test( { 'field': '#aa994g' } ).catch( function( e ) {
			e.type.should.eql( 'wrong-format' );
			done();
		} );
	} );

	it( "should accept right predefined pattern", function( done ) {
		var test = schema( {
			'field': { type: 'color' }
		} );

		test( { 'field': '#aa994f' } ).then( function( ) {
			done();
		} );
	} );

	it( "should complain exceeded max length (string)", function( done ) {
		var test = schema( {
			'field': { type: 'string', max: 3 }
		} );

		test( { 'field': '1234' } ).catch( function( e ) {
			e.type.should.eql( 'max-length-exceeded' );
			done();
		} );
	} );

	it( "should complain exceeded max length (array)", function( done ) {
		var test = schema( {
			'field': { type: 'array', max: 3 }
		} );

		test( { 'field': ['1','2','3','4'] } ).catch( function( e ) {
			e.type.should.eql( 'max-length-exceeded' );
			done();
		} );
	} );

	it( "should accept right max length (string)", function( done ) {
		var test = schema( {
			'field': { type: 'string', max: 3 }
		} );

		test( { 'field': '123' } ).then( function( ) {
			done();
		} );
	} );

	it( "should accept right max length (array)", function( done ) {
		var test = schema( {
			'field': { type: 'array', max: 3 }
		} );

		test( { 'field': ['1','2','3'] } ).then( function( ) {
			done();
		} );
	} );

	it( "should complain dropping below min length (string)", function( done ) {
		var test = schema( {
			'field': { type: 'string', min: 3 }
		} );

		test( { 'field': '12' } ).catch( function( e ) {
			e.type.should.eql( 'min-length-dropped-below' );
			done();
		} );
	} );

	it( "should complain dropping below min length (array)", function( done ) {
		var test = schema( {
			'field': { type: 'array', min: 2 }
		} );

		test( { 'field': ['12'] } ).catch( function( e ) {
			e.type.should.eql( 'min-length-dropped-below' );
			done();
		} );
	} );

	it( "should accept right min length", function( done ) {
		var test = schema( {
			'field': { type: 'string', min: 3 }
		} );

		test( { 'field': '123' } ).then( function( ) {
			done();
		} );
	} );

	it( "should complain exceeded max value", function( done ) {
		var test = schema( {
			'field': { type: 'number', max: 3 }
		} );

		test( { 'field': 4 } ).catch( function( e ) {
			e.type.should.eql( 'max-value-exceeded' );
			done();
		} );
	} );

	it( "should complain dropping below min value", function( done ) {
		var test = schema( {
			'field': { type: 'number', min: 3 }
		} );

		test( { 'field': 2 } ).catch( function( e ) {
			e.type.should.eql( 'min-value-dropped-below' );
			done();
		} );
	} );

	it( "should accept the right type of array items", function( done ) {
		var test = schema( {
			'field': { type: 'array' },
			'field[]': { type: 'string' }
		} );

		test( { 'field': [ 'foo', 'bar', 'soup'] } ).then( function ( ) {
			done();
		} );
	} );

	it( "should not add any extra fields", function( done ) {
		// this test was created due to a bug:
		// the result of this schema test had two fields:
		//  - 'field' and 'field[]'
		var test = schema( {
			'field': { type: 'array' },
			'field[]': { type: 'number' }
		} );

		test( { 'field': [ 42 ] } ).then( function ( obj ) {
			Object.keys(obj).length.should.eql(1);
			obj.field[0].should.eql( 42 );

			done();
		} );
	} );

	it( "should complain about the type of array items", function( done ) {
		var test = schema( {
			'field': { type: 'array' },
			'field[]': { type: 'string' }
		} );

		test( { 'field': [ 'foo', 'bar', 'soup', 42] } ).catch( function ( e ) {
			e.type.should.eql( 'wrong-type' );
			done();
		} );
	} );
	
	it( "should accept empty arrays also when they are marked as mandatory", function( done ) {
		var test = schema( {
			'field': { type: 'array', mandatory: true },
			'field[].foo': { type: 'string' }
		} );

		test( { 'field': [] } ).then( function( ) {
			done();
		} );
	} );

	it( "should apply the mandatory to items of the array", function( done ) {
		var test = schema( {
			'box': { type: 'array' },
			'box[].field': { mandatory: true }
		} );

		// This one should fail, because there is an item in the array
		test({ 'box': [{}] }).catch( function( e ) {
			e.type.should.eql( 'missing-field' );
			done();
		} );
	} );

	it( "should let empty arrays pass the mandatory checks of the items", function( done ) {
		var test = schema( {
			'box': { type: 'array' },
			'box[].field': { mandatory: true }
		} );

		// Empty arrays should pass
		test( { 'box': [] } ).then( function( ) {
			done();
		} );
	} );

} );
