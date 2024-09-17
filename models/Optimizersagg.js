const mongoose = require('mongoose');

const Optimizeragg= new mongoose.Schema({
    oid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      gid: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
      },
      compStatus: {
        type: String,
        required: true
      },
      optmode: {
        type: String,
        required: true
      },
      acstatus: {
        type: Boolean,
        required: true
      },
      rtempfrom: {
        type: Number,
        required: true
      },
      rtempto: {
        type: Number,
        required: true
      },
      ctempfrom: {
        type: Number,
        required: true
      },
      ctempto: {
        type: Number,
        required: true
      },
      humfrom: {
        type: Number,
        required: true
      },
      humto: {
        type: Number,
        required: true
      },
      from: {
        type: Number, // Assuming Unix timestamp
        required: true
      },
      to: {
        type: Number, // Assuming Unix timestamp
        required: true
      },
      counts: {
        type: Number,
        required: true
      }
    }, { timestamps: true });

    const Optimizer_agg =mongoose.model('Optimizeragg',Optimizeragg);
    
    module.exports=Optimizer_agg;