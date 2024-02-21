'use strict';

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    export: async (ctx, next) => {

        var moment = require('moment');

        //let {transId, refId, status} = ctx.request.body
        
        const events = await strapi.services.event.find({ ...ctx.query, _limit: -1 });
    
        ctx.set('Content-Type', 'text/csv');

        var row = [];
        row.push("Datum");
        row.push("Cas");
        row.push("LAT");
        row.push("LON");
        row.push("Bunka vypoctena (ID)");
        row.push("Bunka vypoctena (LAC)");
        row.push("Operator");
        row.push("Typ site");
        row.push("ID bunky");
        row.push("LAC");

        var out = row.join(";")+"\n";

        events.forEach(el => {
            var row = [];
            var dtm = moment(el.happened);
            row.push(dtm.format("DD.MM.YYYY"));
            row.push(dtm.format("HH:mm:ss"));
            row.push(el.position.lat);
            row.push(el.position.lon);
            var regCells = el.cells.filter(c => c.registered == true)
            if(regCells.length > 0)  {
                var rc = regCells[0];                
                const lac = Math.floor(rc.identity.cid / 256);
                row.push(rc.identity.cid - (lac*256));
                row.push(lac);
                row.push(rc.identity.mnc);
                row.push(el.network_type == "G2" ? "GSM" : "LTE");
                row.push(rc.identity.cid);
                row.push(rc.identity.lac);
            }
            
            out += row.join(";")+"\n";
        });
        
        return out;
    },
    bulkInsert: async (ctx, next) => {
        var events = ctx.request.body;
        var savedIds = [];

        const promises = events.map(async el => {            
            const eventSaved = await strapi.services.event.create(el);
            if(eventSaved) {
                savedIds.push(eventSaved.uid);
            }
        });

        await Promise.all(promises)

        return savedIds;
    }
};
