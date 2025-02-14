__MASSAGES = {
    'MaxLength': 'Убедитесь, что это значение содержит не более %d символов',
    'MinLength': 'Убедитесь, что это значение содержит не менее %d символов'
}

def get_validators(validators)->list:
    parsed = []
    for val in validators:
        parsed.append(parse_validator(val))
    return parsed
        

def parse_validator(val)->dict:
    name:str = val.__class__.__name__.replace('Validator', '')
    match name:
        case 'MaxLength' | 'MinLength':
            return {
                'rule': '%s=%d' % (uncapitalize(name), val.limit_value),
                'message': __MASSAGES[name] % val.limit_value
            }
        case 'MaxValue' | 'MinValue':
            return {
                'rule': uncapitalize(name),
                'message': val.message % {'limit_value':val.limit_value},
                'limit_value': val.limit_value
            }
        
    return {'rule': uncapitalize(name), 'message': val.message}

def uncapitalize(string:str)->str:
    return string[0].lower()+string[1:]