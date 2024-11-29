interface Address {
    'city': null|string,
    'city_code': null|string,
    'address': null|string,
    'organization': null|string
}
export interface User {
    primary_id: string,
    name: string,
    id: string,
    address: Address,
    type: string,
    email: string,
    phone : string,
}

export class UserUtils {
    apiResult : any;
    user : User;
    constructor(apiResult) {
        this.apiResult = apiResult;
    }

    getUser() : User {
        let address : Address = this.getPreferredAddress();

        this.user = {
            primary_id: this.getPrimaryID(),
            name: this.getFullName(),
            id: this.getUserId(),
            address: {
                'city': address.city,
                'city_code': address.city_code,
                'address': address.address,
                'organization': address.organization
            },
            type: this.getUserType(),
            email: this.getUserEmail(),
            phone : this.getUserPhone(),
        }

        return this.user;
    }

    private getUserType(): string {
        let userGroupCode = this.apiResult?.user_group?.value;
        let userGroup = '';

        switch (userGroupCode) {
            case '02':
            case '12':
                userGroup = 'employee';
                break;
            case '01':
            case '11':
                userGroup = 'student';
                break;
            case '20':
                userGroup = 'vll';
                break;
            default:
                userGroup = '';
        }

        return userGroup;
    }

    private getPrimaryID() : string {
        return this.apiResult?.primary_id;
    }

    private getFullName() : string {
        return this.apiResult?.full_name;
    }

    private getPreferredAddress() : Address {
        let userAddress : Address = {
            'city': null,
            'city_code': null,
            'address': null,
            'organization': null
        };

        if (typeof this.apiResult?.contact_info?.address === 'object') {
            for (let i in this.apiResult.contact_info.address) {
                if (userAddress.city == null || this.apiResult.contact_info.address[i].preferred) {
                    userAddress.address = this.apiResult.contact_info.address[i]?.line1;
                    userAddress.city = this.apiResult.contact_info.address[i]?.city;
                    userAddress.city_code = this.apiResult.contact_info.address[i]?.postal_code;
                    userAddress.organization = this.getOrgNumber(this.apiResult.contact_info.address[i]?.line2);
                }
            }
        }

        return userAddress;
    }

    private getOrgNumber(addressLine2) : string {
        let orgNumber = '';

        if (addressLine2 !== undefined) {
            let matches = addressLine2.match(/(\d+)/);

            if (matches) {
                orgNumber = matches[0];
            }
        }

        return orgNumber;
    }

    private getUserId() : string {
        let userId = '';

        if (this.apiResult?.birth_date !== undefined && this.apiResult?.primary_id !== undefined) {
            userId = this.getFullPID(this.apiResult.birth_date, this.apiResult.primary_id);
        }

        if (typeof this.apiResult?.user_identifier === 'object') {
            for (let i in this.apiResult.user_identifier) {
                if (this.apiResult.user_identifier[i]?.id_type?.value === '06') {
                    userId = this.apiResult.user_identifier[i]?.value;
                }
            }
        }

        return userId;
    }

    private getFullPID(birthDate, pid) : string {
        let mc = birthDate.substr(0, 2);

        return mc + pid.substr(0, 6) + '-' + pid.substr(6);
    }

    private getUserEmail() : string {
        let userEmail = '';
        if (typeof this.apiResult?.contact_info?.email === 'object') {

            for (let i in this.apiResult.contact_info.email) {
                if (userEmail === '' || this.apiResult.contact_info.email[i].preferred) {
                    userEmail = this.apiResult.contact_info.email[i].email_address;
                }
            }
        }

        return userEmail;
    }

    private getUserPhone() : string {
        let userPhone = '';
        if (typeof this.apiResult?.contact_info?.phone === 'object') {

            for (let i in this.apiResult.contact_info.phone) {
                if (userPhone === '' || this.apiResult.contact_info.phone[i].preferred) {
                    userPhone = this.apiResult.contact_info.phone[i].phone_number;
                }
            }
        }

        return userPhone;
    }
}
