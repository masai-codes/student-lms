import { describe, expect, it } from 'vitest'
import {
  isAgreementDetailsValid,
  sanitizePan,
  validateAgreementDetails,
} from './agreementValidation'
import type { AgreementFormValues } from '@/server/api/dashboard/agreement/agreementShared'

/** A fully-valid detail set (working status → work domain required). */
const validValues: AgreementFormValues = {
  name: 'Riya', dateOfBirth: '2000-01-01', gender: 'female', address: '12 MG Rd', location: 'Bengaluru',
  parentsName: 'Anil', parentsEmail: 'anil@example.com', parentsMobileCountry: '+91', parentsMobile: '9876543210',
  currentStatus: 'working', workDomain: 'tech', educationDetails: 'btech_cs', graduationYear: '2021', collegeName: 'IIT',
}

describe('sanitizePan', () => {
  it('uppercases, strips non-alphanumerics, caps at 10', () => {
    expect(sanitizePan('abcde-1234-f!!')).toBe('ABCDE1234F')
  })
})

describe('validateAgreementDetails', () => {
  it('passes a complete, valid form', () => {
    expect(isAgreementDetailsValid(validValues)).toBe(true)
  })

  it('flags missing required fields', () => {
    const errors = validateAgreementDetails({})
    expect(errors.name).toBeTruthy()
    expect(errors.parentsEmail).toBeTruthy() // required
    expect(errors.currentStatus).toBeTruthy()
    expect(errors.companyName).toBeUndefined() // optional
  })

  it('requires work domain only when working, study year only when studying', () => {
    expect(validateAgreementDetails({ ...validValues, currentStatus: 'working', workDomain: '' }).workDomain).toBeTruthy()
    const studying = validateAgreementDetails({ ...validValues, currentStatus: 'studying', workDomain: '', studyYear: '' })
    expect(studying.studyYear).toBeTruthy()
    expect(studying.workDomain).toBeUndefined() // hidden when studying
  })

  it('validates email, phone length, year, PAN, DOB and negatives', () => {
    expect(validateAgreementDetails({ ...validValues, parentsEmail: 'nope' }).parentsEmail).toBeTruthy()
    expect(validateAgreementDetails({ ...validValues, parentsMobile: '123' }).parentsMobile).toBe('Enter a 10-digit number.')
    expect(validateAgreementDetails({ ...validValues, graduationYear: '99' }).graduationYear).toBeTruthy()
    expect(validateAgreementDetails({ ...validValues, panNumber: 'BAD' }).panNumber).toBeTruthy()
    expect(validateAgreementDetails({ ...validValues, panNumber: 'ABCDE1234F' }).panNumber).toBeUndefined()
    expect(validateAgreementDetails({ ...validValues, dateOfBirth: '2999-01-01' }).dateOfBirth).toBeTruthy()
    expect(validateAgreementDetails({ ...validValues, ctc: '-5' }).ctc).toBeTruthy()
  })
})
