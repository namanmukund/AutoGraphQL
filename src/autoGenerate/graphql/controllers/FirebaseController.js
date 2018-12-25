import admin from '../../../firebase';
import MasterController from './MasterController';

class FirebaseController extends MasterController {
  constructor(model, authentication) {
    super(model, authentication);
    this.db = admin.database();
  }
  updateDocument(queryField, updateField) {
    this.validate();
    return this.db.ref(`/${this.modelName}`).child(queryField).set(updateField);
  }
}

export default FirebaseController;
