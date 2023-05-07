import clsHooked from 'cls-hooked';
import winstonConfig from '../config/winstonConfig';

const ns = clsHooked.createNamespace(winstonConfig.serviceName);

const cls = {
  middleware: (req, res, next) => {
    ns.bindEmitter(req);
    ns.bindEmitter(res);

    ns.run(() => next());
  },

  get: ({ key }) => {
    if (ns && ns.active) {
      return ns.get(key);
    }
    return null;
  },

  set: ({ key, value }) => {
    if (ns && ns.active) {
      return ns.set(key, value);
    }
    return null;
  },
};

export default cls;
