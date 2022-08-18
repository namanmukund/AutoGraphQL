import { MutationController } from '../../../controllers';

const removeBatchStudentsMutationResolver = async (
    root,
    params,
    typeName,
    info,
    mutationName,
    ast,
    context,
) => {
    const { batchId } = params;
    const newAuthentication = {
        bypass: true,
    };
    const query = {
        id: batchId,
    };
    const updateObj = {
    $set: {
        students: [],
        batchStudents: [],
    },
    };
    const modelMutation = new MutationController('Batch', newAuthentication);
    await modelMutation.update(query, updateObj);
    return { batchId };
};
export default removeBatchStudentsMutationResolver;
