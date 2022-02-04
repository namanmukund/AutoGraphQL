import { rangeOTP } from "../../../../../constants";
import grades from "../../../../../constants/grades";
import { getRandomNumber } from "../../../../../utils";
import checkIfOtpPresent from "./checkIfOtpPresent";

//recursive function which checks if the otp already exists
const finalOtp = (otpMap) => {
    let otp = getRandomNumber(rangeOTP.min, rangeOTP.max)
    let alreadyExists = checkIfOtpPresent(otp)
    if (!otpMap[otp] && !alreadyExists) {
        return otp
    }
    return finalOtp(otpMap)
}

//finding all combinations on the basis of grade and section combination
const arrayCombinations = () => {
    let otpMap = {}
    for (let sectionPointer = 0; sectionPointer < 26; sectionPointer++) {
        for (let gradePointer = 1; gradePointer < grades.length + 1; gradePointer++) {
            let section = String.fromCharCode(sectionPointer + 65)
            otpMap[section + gradePointer] = finalOtp()
        }
    }
    return otpMap
}

export default arrayCombinations