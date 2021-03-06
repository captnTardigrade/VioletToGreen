import argparse
import os
from re import A

"""
Script to Evaluate the predictions generated by our tool against the manually annotated set of comment to code links
Pass relevant arguments to evaluate single files or to evaluate the entire dataset.

Run the following command to compare two files:
python3 evaluation.py --method single --code <path of code file> --label <path of annotated file> --prediction <path of predicted file>

Example:
python3 evaluation.py --method single --code ../Dataset/ToyData/CodeFiles/BubbleSort.java --label ../Dataset/ToyData/Annotations/BubbleSort.txt --prediction ../Dataset/ToyData/Predictions/BubbleSort.txt

python3 evaluation.py --method single --code ../Dataset/ToyData/CodeFiles/Empty.java --label ../Dataset/ToyData/Annotations/Empty.txt --prediction ../Dataset/ToyData/Predictions/Empty.txt

To evaluate the entire toy dataset, run the following command:
python3 evaluation.py --method toy_set --verbose

To evaluate the entire real world dataset, run the following command:
python3 evaluation.py --method real_set --verbose
"""


def evaluate_single_file(code_file_name, label_file_name, prediction_file_name, verbose):
    """
    Evaluate the predictions generated by our tool against the manually annotated set of comment to code links
    """
    print(code_file_name)
    print(label_file_name)
    print(prediction_file_name)
    try:
        code_file = open(code_file_name, 'r')
        # print(code_file_name)
        code_lines = code_file.readlines()
        # print(label_file_name)
        label_file = open(label_file_name, 'r')
        label_lines = label_file.readlines()
        prediction_file = open(prediction_file_name, 'r')
        prediction_lines = prediction_file.readlines()
    except FileNotFoundError:
        return
    labels = []
    predictions = []

    """ print("Code File")
    count = 0
    for line in code_lines:
        count += 1
        print("Line{}: {}".format(count, line)) """

    # print("Label File")
    for line in label_lines:
        parts = line.replace(',', ' ').split()
        labels.append({'comment_start_row': int(parts[0]),
                       'comment_start_char': int(parts[1]),
                       'comment_end_row': int(parts[2]),
                       'comment_end_char': int(parts[3]),
                       'code_start_row': int(parts[4]),
                       'code_start_char': int(parts[5]),
                       'code_end_row': int(parts[6]),
                       'code_end_char': int(parts[7])})
    # print('labels:')
    # for label in labels:
    #     print(label.values())

    # print("Prediction File")
    for line in prediction_lines:
        parts = line.replace(',', ' ').split()
        predictions.append({'comment_start_row': int(parts[0]),
                            'comment_start_char': int(parts[1]),
                            'comment_end_row': int(parts[2]),
                            'comment_end_char': int(parts[3]),
                            'code_start_row': int(parts[4]),
                            'code_start_char': int(parts[5]),
                            'code_end_row': int(parts[6]),
                            'code_end_char': int(parts[7])})
    # print()
    # print()
    # print('pred:')
    # for label in predictions:
    #     print(label.values())

    # print('--------------------------------')
    total_accuracy = 0.0
    comment_count = 0
    flag_label = None
    for prediction in predictions:
        for label in labels:
            if prediction['comment_start_row'] == label['comment_start_row'] and prediction['comment_start_char'] == label['comment_start_char'] and prediction['comment_end_row'] == label['comment_end_row'] and prediction['comment_end_char'] == label['comment_end_char'] and prediction['code_start_row'] == label['code_start_row'] and prediction['code_end_char'] == label['code_end_char'] and prediction['code_end_row'] == label['code_end_row'] and prediction['code_end_char'] == label['code_end_char']:
                # print("exact comment match found")
                flag_label = label
                break
            elif prediction['comment_start_row'] == label['comment_start_row'] and prediction['comment_start_char'] == label['comment_start_char']:
                # print("comment match found")
                flag_label = label
                break

        # print(prediction['comment_start_row'], label['comment_start_row'])

        row_number = prediction['code_start_row']
        prediction_length = 0
        label_length = 0
        overlap_length = 0
        false_length = 0
        total_length = 0

        while row_number <= prediction['code_end_row']:
            row_pred = code_lines[row_number - 1].rstrip()
            pred_start = 1
            pred_end = len(row_pred)
            if row_number == prediction['code_end_row']:
                row_pred = row_pred[:(prediction['code_end_char']-1)]
                pred_end = prediction['code_end_char']
            if row_number == prediction['code_start_row']:
                row_pred = row_pred[(prediction['code_start_char']-1):]
                pred_start = prediction['code_start_char']
            # print(row_pred)
            prediction_length += len(row_pred)
            if flag_label is not None and row_number >= flag_label['code_start_row'] and row_number <= flag_label['code_end_row']:
                row_label = code_lines[row_number - 1].rstrip()
                label_start = 1
                label_end = len(row_label)
                if row_number == label['code_end_row']:
                    row_label = row_label[:(label['code_end_char']-1)]
                    label_end = label['code_end_char']
                if row_number == label['code_start_row']:
                    row_label = row_label[(label['code_start_char']-1):]
                    label_start = label['code_start_char']
                label_length += len(row_label)
                # print(row_label)
                overlap = min(pred_end, label_end) - \
                    max(pred_start, label_start)
                if overlap < 0:
                    overlap = 0
                #print('overlap', overlap)
                total = max(pred_end, label_end) - min(pred_start, label_start)
                #print('total', total)
                # print('false', max(pred_end, label_end) - min(pred_end, label_end) + max(pred_start, label_start) - min(pred_start, label_start))
                overlap_length += overlap
                # false_length += max(pred_end, label_end) - min(pred_end, label_end) + max(pred_start, label_start) - min(pred_start, label_start)
                total_length += total

            row_number += 1
        # print("Prediction Length: {}".format(prediction_length))
        # print("Label Length: {}".format(label_length))
        # print("Overlap Length: {}".format(overlap_length))
        if label_length == 0:
            # print("Empty Label")
            continue
        #print('Totoal overlap length: {}'.format(overlap_length))
        #print('Total false length: {}'.format(false_length))
        #print('Total length: {}'.format(total_length))
        accuracy = float(overlap_length)/float(total_length)
        total_accuracy += accuracy
        if verbose == True:
            print(prediction['comment_start_row'])
            print("Accuracy: {0:.4f}".format(accuracy))
        comment_count += 1
    if comment_count == 0:
        # if no comments were found in the file, return accuracy 1 and prevent Division by Zero Error
        #print("returns accuracy 1 for empty")
        return 1.0
    average_accuracy = total_accuracy/comment_count
    print('---------------------------------------------------------')
    print('File Name: {}'.format(code_file_name))
    print("Average Accuracy: {}".format(average_accuracy))
    return average_accuracy


def evaluate_set(file_set, verbose):
    dir_name = os.path.dirname('../Dataset')
    if file_set == 'toy_set':
        dir_name += '/Dataset/ToyData/'
    elif file_set == 'real_set':
        dir_name += '/Dataset/RealWorldData/'
    elif file_set == 'custom':
        dir_name += '/Dataset/RealWorldData/'

    accuracy = 0.0
    count = 0
    # prediction_files = os.listdir(dir_name + 'Predictions/')
    prediction_files = os.listdir(dir_name + 'Predictions/test/')
    for filename in prediction_files:
        if filename.endswith('.txt') == True:
            # code_file_name = dir_name + 'CodeFiles/' + \
            #     filename.replace('.txt', '.java')
            # label_file_name = dir_name + 'Annotations/' + filename
            # prediction_file_name = dir_name + 'Predictions/' + filename
            # a = evaluate_single_file(code_file_name,
            #                          label_file_name, prediction_file_name, False)
            # if a is not None:
            #     accuracy += a

            code_file_name = dir_name + 'CodeFiles/test/' + \
                filename.replace('.txt', '.java')
            label_file_name = dir_name + 'Annotations/test/' + filename
            prediction_file_name = dir_name + 'Predictions/test/' + filename
            a = evaluate_single_file(code_file_name,
                                     label_file_name, prediction_file_name, False)
            if a is not None:
                accuracy += a
            # print("code_file_name", code_file_name)
            # print("label_file_name", label_file_name)
            # print("prediction_file_name", prediction_file_name)
            # print('---------')
                count += 1
            # if verbose == True:
            # print('Accuracy for file ' + filename + ': ' + str(accuracy/count))
    print('Average Accuracy on the entire dataset: {}'.format(accuracy/count))
    print('Total number of files:', count)


def main():
    argparser = argparse.ArgumentParser()
    argparser.add_argument('--method', help='evaluate single file or toy dataset or real dataset',
                           choices=['single', 'toy_set', 'real_set', 'custom'], default='single')
    argparser.add_argument(
        '--verbose', help='enable verbose evaluation report', action='store_true', default=False)

    argparser.add_argument(
        '--code', type=str, default='../Dataset/ToyData/CodeFiles/BubbleSort.java', help='manual annotations file')
    argparser.add_argument(
        '--label', type=str, default='../Dataset/ToyData/Annotations/BubbleSort.txt', help='manual annotations file')
    argparser.add_argument('--prediction', type=str,
                           default='./prediction_test1.txt', help='predicted annotations file')

    args = argparser.parse_args()

    # print(args.method)
    # print(args.label)
    # print(args.prediction)

    if args.method == 'single':
        evaluate_single_file(args.code, args.label,
                             args.prediction, args.verbose)
    elif args.method == 'toy_set':
        evaluate_set(args.method, args.verbose)
    elif args.method == 'real_set':
        evaluate_set(args.method, args.verbose)
    elif args.method == 'custom':
        evaluate_set(args.method, args.verbose)


if __name__ == "__main__":
    main()
