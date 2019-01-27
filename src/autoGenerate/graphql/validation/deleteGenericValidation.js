import {EitherEmailOrPhoneRequiredError} from "../../../../constants/errors";
import {commonUserValidation} from "../preHookFunctions/validation/utils";
import {generateUsername, validateUsername} from "./index";
import callGraphqlApi from '../../../api/callGraphqlApi';
import { CannotDeleteChapter } from '../../../../constants/errors';

const deleteGenericValidation = async (input, params, typeName) => {

    //const queryTypeName = lowerCase(typeName);
    const id = params.id;
    const mutation = `
  query{
    chapter(id:"${id}"){
      topicsMeta(filter:{
        status:published
      }){
        count
      }
    }
  }
  `


        let response = await callGraphqlApi(mutation);

const { data } = response;
const count = data.chapter.topicsMeta.count;

if(count > 0){
throw new CannotDeleteChapter();
}
    // const { name, username, email, phone } = input;
    // if (!email && !phone) {
    //     throw new EitherEmailOrPhoneRequiredError();
    // }
    //
    // commonUserValidation({ name, email, phone });
    //
    // const doc = {};
    // if (!username) {
    //     let newUsername;
    //     try {
    //         newUsername = await generateUsername(input);
    //     } catch (err) {
    //         return err;
    //     }
    //     Object.assign(doc, {
    //         username: newUsername,
    //     });
    // } else {
    //     validateUsername(username);
    // }
    // return doc;
};

export default deleteGenericValidation;
