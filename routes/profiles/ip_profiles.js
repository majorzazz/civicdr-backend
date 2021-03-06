const defined = require('defined');
const { RecordNotFound, NotNullViolation } = require('../../errors');
const has = require('has');
const R = require('ramda');

module.exports = (IpProfile, userAllowedReadKeys, Email) => {
  return {
    createIpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;

      /* Save data to  db */
      try {
        let id = await IpProfile.create(data, req.user);
        res.status(200).json(id);
      } catch (e) {
        if (e instanceof NotNullViolation) {
          res.boom.badData(e.message);
        } else {
          logger.error(e);
          res.boom.badImplementation('server error!');
        }
      }
    },

    /* If not admin and allowed to read own route
     * only provide allowed keys */
    getIpProfile: async (req, res) => {
      let id = req.params.id;

      let [ipProfile] = await IpProfile.findById(id);
      if (defined(ipProfile)) {
        if (req.user.role === 'ip') {
          ipProfile = R.pick(userAllowedReadKeys, ipProfile);
        }
        res.status(200).json(ipProfile);
      } else {
        res.boom.notFound('That profile does not exist');
      }
    },

    getIpProfileKey: async (req, res) => {
      /* TODO: validate input */
      let id = req.params.id;

      try {
        let [ipProfile] = await IpProfile.findById(id);
        if (defined(ipProfile) && has(ipProfile, 'pgp_key')) {
          res.setHeader('Content-type', 'text/plain');
          res.status(200).send(`${ipProfile.pgp_key}`);
        } else {
          res.boom.notFound('That profile does not exist');
        }
      } catch (e) {
        logger.error(e);
        res.boom.badImplementation('server error!');
      }
    },

    getIpProfiles: async (req, res) => {
      let ipProfiles = await IpProfile.find();
      res.status(200).json(ipProfiles);
    },

    updateIpProfile: async (req, res) => {
      /* TODO: validate input */
      let data = req.body;

      let id = req.params.id;

      /* Save data to db */
      try {
        await IpProfile.update(id, data, req.user);

        // notify admin on updates
        await Email.notifyAdmin();
        res.status(200).send('Success');
      } catch (e) {
        if (e instanceof RecordNotFound) {
          return res.boom.badRequest(e.message);
        } else {
          throw e;
        }
      }
    }
  };
};
