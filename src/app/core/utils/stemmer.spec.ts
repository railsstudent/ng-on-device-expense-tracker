import { describe, it, expect } from 'vitest';
import { stemmer } from './stemmer';

describe('Porter Stemmer', () => {
  it('should handle empty or very short words', () => {
    expect(stemmer('')).toBe('');
    expect(stemmer('a')).toBe('a');
    expect(stemmer('to')).toBe('to');
  });

  it('should strip plurals (Step 1a)', () => {
    expect(stemmer('caresses')).toBe('caress');
    expect(stemmer('ponies')).toBe('poni');
    expect(stemmer('ties')).toBe('ti');
    expect(stemmer('cats')).toBe('cat');
  });

  it('should strip past tense and continuous inflections (Step 1b)', () => {
    expect(stemmer('feed')).toBe('feed');
    expect(stemmer('agreed')).toBe('agre');
    expect(stemmer('plastered')).toBe('plaster');
    expect(stemmer('bled')).toBe('bled');
    expect(stemmer('singing')).toBe('sing');
    expect(stemmer('conflating')).toBe('conflat');
    expect(stemmer('troubling')).toBe('troubl');
    expect(stemmer('filing')).toBe('file');
  });

  it('should normalize double consonant suffix adjustments', () => {
    expect(stemmer('falling')).toBe('fall');
    expect(stemmer('hissing')).toBe('hiss');
    expect(stemmer('fizzing')).toBe('fizz');
    expect(stemmer('hopping')).toBe('hop');
    expect(stemmer('tanning')).toBe('tan');
  });

  it('should handle terminal Y conversions (Step 1c)', () => {
    expect(stemmer('happy')).toBe('happi');
    expect(stemmer('sky')).toBe('sky');
  });

  it('should reduce double suffixes (Step 2)', () => {
    expect(stemmer('relational')).toBe('relat');
    expect(stemmer('conditional')).toBe('condit');
    expect(stemmer('rational')).toBe('ration');
    expect(stemmer('valenci')).toBe('valenc');
    expect(stemmer('hesitanci')).toBe('hesit');
    expect(stemmer('digitizer')).toBe('digit');
    expect(stemmer('conformabli')).toBe('conform');
    expect(stemmer('radicalli')).toBe('radic');
    expect(stemmer('differentli')).toBe('differ');
    expect(stemmer('vileli')).toBe('vile');
    expect(stemmer('analogousli')).toBe('analog');
    expect(stemmer('vietnamization')).toBe('vietnam');
    expect(stemmer('predication')).toBe('predic');
    expect(stemmer('operator')).toBe('oper');
    expect(stemmer('feudalism')).toBe('feudal');
    expect(stemmer('decisiveness')).toBe('decis');
    expect(stemmer('hopefulness')).toBe('hope');
    expect(stemmer('callousness')).toBe('callous');
    expect(stemmer('formaliti')).toBe('formal');
    expect(stemmer('sensitiviti')).toBe('sensit');
    expect(stemmer('sensibiliti')).toBe('sensibl');
  });

  it('should perform simple suffix reductions (Step 3)', () => {
    expect(stemmer('triplicate')).toBe('triplic');
    expect(stemmer('formative')).toBe('form');
    expect(stemmer('formalize')).toBe('formal');
    expect(stemmer('electriciti')).toBe('electr');
    expect(stemmer('electrical')).toBe('electr');
    expect(stemmer('hopeful')).toBe('hope');
    expect(stemmer('goodness')).toBe('good');
  });

  it('should strip Step 4 suffixes based on word measure', () => {
    expect(stemmer('revival')).toBe('reviv');
    expect(stemmer('allowance')).toBe('allow');
    expect(stemmer('inference')).toBe('infer');
    expect(stemmer('airliner')).toBe('airlin');
    expect(stemmer('gyroscopic')).toBe('gyroscop');
    expect(stemmer('adjustable')).toBe('adjust');
    expect(stemmer('defensible')).toBe('defens');
    expect(stemmer('irritant')).toBe('irrit');
    expect(stemmer('replacement')).toBe('replac');
    expect(stemmer('adjustment')).toBe('adjust');
    expect(stemmer('dependent')).toBe('depend');
    expect(stemmer('adoption')).toBe('adopt');
    expect(stemmer('homologou')).toBe('homolog');
    expect(stemmer('communism')).toBe('commun');
    expect(stemmer('activate')).toBe('activ');
    expect(stemmer('angulariti')).toBe('angular');
    expect(stemmer('effective')).toBe('effect');
    expect(stemmer('bowdlerize')).toBe('bowdler');
  });

  it('should handle terminal E and L stripping (Step 5a/5b)', () => {
    expect(stemmer('probate')).toBe('probat');
    expect(stemmer('rate')).toBe('rate');
    expect(stemmer('cease')).toBe('ceas');
    expect(stemmer('controll')).toBe('control');
    expect(stemmer('roll')).toBe('roll');
  });

  it('should normalize casing and special characters', () => {
    expect(stemmer('SPENDING')).toBe('spend');
    expect(stemmer('traveling!')).toBe('travel');
  });
});
