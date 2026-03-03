export interface Contact {
  firstName: string;
  lastName: string;
  company: string;
  jobTitle: string;
  mobilePhone: string;
  workPhone: string;
  email: string;
  website: string;
  address: string;
  city: string;
  postalCode: string;
  country: string;
  notes: string;
  photoUri?: string;
}

export const EMPTY_CONTACT: Contact = {
  firstName: '',
  lastName: '',
  company: '',
  jobTitle: '',
  mobilePhone: '',
  workPhone: '',
  email: '',
  website: '',
  address: '',
  city: '',
  postalCode: '',
  country: '',
  notes: '',
  photoUri: undefined,
};
