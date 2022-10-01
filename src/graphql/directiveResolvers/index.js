// the resolvers for the directives defined in your schema
import { get } from 'lodash';
import { DEFAULT_CLAMP_VALUE } from '../../../constants';
import commonFunctionForRelationAndMeta from './utils/commonFunctionForRelationAndMeta';

const directiveResolvers = {
  async relation(result, root, params, context, info) {
    return commonFunctionForRelationAndMeta(result, root, params, context, info);
  },
  async remote(result) {
    return result;
  },
  async relationalMeta(result, root, params, context, info) {
    return commonFunctionForRelationAndMeta(result, root, params, context, info, true);
  },
  async nameCase(result) {
    if ((typeof result === 'string') && (result !== '')) {
      let resultString = result.trim().toLowerCase();

      // Split names on regex whitespace, dash or apostrophe, workaround for
      // Javascript regex word boundary \b splitting on unicode characters
      const splitters = [
        { s: /\s/, r: ' ' },
        { s: /-/, r: '-' },
        { s: /'/, r: "'" },
        { s: /"/, r: '"' },
        { s: /\(/, r: '(' },
        { s: /\./, r: '.' },
      ];

      for (let i = 0; i < splitters.length; i += 1) {
        const elArr = resultString.split(splitters[i].s);
        for (let j = 0; j < elArr.length; j += 1) {
          elArr[j] = elArr[j].charAt(0).toUpperCase() + elArr[j].slice(1);
        }
        resultString = elArr.join(splitters[i].r);
      }

      // Name case Mcs and Macs
      // Exclude names with 1-2 letters after prefix like Mack, Macky, Mace
      // Exclude names ending in a,c,i,o, or j are typically Polish or Italian
      if (
        new RegExp(/\bMac[A-Za-z]{2,}[^aciozj]\b/).test(resultString)
         || new RegExp(/\bMc/).test(resultString)
      ) {
        resultString = resultString.replace(/\b(Ma?c)([A-Za-z]+)/, (x, y, z) => y + z.charAt(0).toUpperCase() + z.substring(1));

        // Now correct for "Mac" exceptions
        resultString = resultString
          .replace(/\bMacEvicius\b/, 'Macevicius')
          .replace(/\bMacHado\b/, 'Machado')
          .replace(/\bMacHar\b/, 'Machar')
          .replace(/\bMacHin\b/, 'Machin')
          .replace(/\bMacHlin\b/, 'Machlin')
          .replace(/\bMacIas\b/, 'Macias')
          .replace(/\bMacIulis\b/, 'Maciulis')
          .replace(/\bMacKie\b/, 'Mackie')
          .replace(/\bMacKle\b/, 'Mackle')
          .replace(/\bMacKlin\b/, 'Macklin')
          .replace(/\bMacQuarie\b/, 'Macquarie')
          .replace(/\bMacOmber\b/, 'Macomber')
          .replace(/\bMacIn\b/, 'Macin')
          .replace(/\bMacKintosh\b/, 'Mackintosh')
          .replace(/\bMacKen\b/, 'Macken')
          .replace(/\bMacHen\b/, 'Machen')
          .replace(/\bMacHiel\b/, 'Machiel')
          .replace(/\bMacIol\b/, 'Maciol')
          .replace(/\bMacKell\b/, 'Mackell')
          .replace(/\bMacKlem\b/, 'Macklem')
          .replace(/\bMacKrell\b/, 'Mackrell')
          .replace(/\bMacLin\b/, 'Maclin')
          .replace(/\bMacKey\b/, 'Mackey')
          .replace(/\bMacKley\b/, 'Mackley')
          .replace(/\bMacHell\b/, 'Machell')
          .replace(/\bMacHon\b/, 'Machon');
      }

      // And correct Mac exceptions otherwise missed
      resultString = resultString
        .replace(/\bMacmurdo/, 'MacMurdo')
        .replace(/\bMacisaac/, 'MacIsaac')

      // Fixes for "son (daughter) of" etc. in various languages.
        .replace(/\bAl(?=\s+\w)/g, 'al') // al Arabic or forename Al.
        .replace(/\bAp\b/g, 'ap') // ap Welsh.
        .replace(/\bBen(?=\s+\w)\b/g, 'ben') // ben Hebrew or forename Ben.
        .replace(/\bDell([ae])\b/g, 'dell$1') // della and delle Italian.
        .replace(/\bD([aeiu])\b/g, 'd$1') // da, de, di Italian; du French.
        .replace(/\bDe([lr])\b/g, 'de$1') // del Italian; der Dutch/Flemish.
        .replace(/\bEl\b/g, 'el') // el Greek
        .replace(/\bLa\b/g, 'la') // la French
        .replace(/\bL([eo])\b/g, 'l$1') // lo Italian; le French.
        .replace(/\bVan(?=\s+\w)/g, 'van') // van German or forename Van.
        .replace(/\bVon\b/g, 'von') // von Dutch/Flemish

      // Fixes for roman numeral names, e.g. Henry VIII
        .replace(
          /\b(?:\d{4}|(?:[IVX])(?:X{0,3}I{0,3}|X{0,2}VI{0,3}|X{0,2}I?[VX]))$/i,
          (v) => v.toUpperCase(),
        )

      // Nation of Islam 2X, 3X, etc. names
        .replace(/\b[0-9](x)\b/, (v) => v.toUpperCase())

      // Somewhat arbitrary rule where two letter combos not containing vowels should be capitalized
      // fixes /JJ Abrams/ and /JD Salinger/
      // With some exceptions
        .replace(
          /\b[bcdfghjklmnpqrstvwxyzBCDFGHJKLMNPQRSTVWXYZ]{2}\s/,
          (v) => v.toUpperCase(),
        )
        .replace(/\bMR\s/, 'Mr')
        .replace(/\bMS\s/, 'Ms')
        .replace(/\bDR\s/, 'Dr')
        .replace(/\bST\s/, 'St')
        .replace(/\bJR\s/, 'Jr')
        .replace(/\bSR\s/, 'Sr')
        .replace(/\bLT\s/, 'Lt')

      // lowercase words
        .replace(/\bThe\b/g, 'the')
        .replace(/\bOf\b/g, 'of')
        .replace(/\bAnd\b/g, 'and')
        .replace(/\bY\s/g, 'y')

      // strip extra spaces
        .replace(/\s{2,}/g, ' ');

      // force first character to be uppercase
      return resultString.charAt(0).toUpperCase() + resultString.substring(1);
    }
    return result;
  },
  async clamp(result, _root, params) {
    if (!result) return result;
    const minValue = get(params, 'min', DEFAULT_CLAMP_VALUE.MIN);
    const maxValue = get(params, 'max', DEFAULT_CLAMP_VALUE.MAX);
    return Math.min(Math.max(result, minValue), maxValue);
  },
};

export default directiveResolvers;
