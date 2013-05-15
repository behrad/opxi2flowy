/**
 * Created with PyCharm.
 * User: jrad
 * Date: 5/14/13
 * Time: 2:00 PM
 * To change this template use File | Settings | File Templates.
 */

var moment = require( 'moment' );

console.log(
    Math.abs( moment( "Tue May 14 2013 14:18:58" ).diff( moment(new Date() ) ) )
);
